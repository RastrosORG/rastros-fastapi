import boto3
import uuid
from fastapi import UploadFile, HTTPException
from app.core.config import configuracoes

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=configuracoes.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=configuracoes.AWS_SECRET_ACCESS_KEY,
        region_name=configuracoes.AWS_REGION,
    )

LIMITE_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB


def upload_arquivo(
    arquivo: UploadFile,
    pasta: str,
) -> tuple[str, str]:
    """
    Faz upload de um arquivo para o S3.
    Retorna (nome_arquivo, url_s3).
    Rejeita arquivos acima de 50 MB.
    """
    if not configuracoes.AWS_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="Bucket S3 não configurado")

    # Verifica tamanho sem consumir o stream
    arquivo.file.seek(0, 2)
    tamanho = arquivo.file.tell()
    arquivo.file.seek(0)
    if tamanho > LIMITE_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Limite: 50 MB (recebido: {tamanho // (1024*1024)} MB)"
        )

    extensao = arquivo.filename.split('.')[-1] if arquivo.filename else 'bin'
    nome_unico = f"{pasta}/{uuid.uuid4()}.{extensao}"

    try:
        s3 = get_s3_client()
        s3.upload_fileobj(
            arquivo.file,
            configuracoes.AWS_BUCKET_NAME,
            nome_unico,
            ExtraArgs={'ContentType': arquivo.content_type or 'application/octet-stream'}
        )
        url = f"https://{configuracoes.AWS_BUCKET_NAME}.s3.{configuracoes.AWS_REGION}.amazonaws.com/{nome_unico}"
        return arquivo.filename or nome_unico, url
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")

def deletar_arquivo(url_s3: str) -> None:
    try:
        s3 = get_s3_client()
        chave = url_s3.split('.amazonaws.com/')[-1]
        s3.delete_object(Bucket=configuracoes.AWS_BUCKET_NAME, Key=chave)
    except Exception:
        pass  # falha silenciosa — log em produção


def deletar_arquivos_lote(urls_s3: list[str]) -> None:
    """
    Deleta múltiplos objetos do S3 em uma única chamada (delete_objects).
    Silencia falhas para não bloquear a exclusão do dossiê no banco.
    """
    if not urls_s3 or not configuracoes.AWS_BUCKET_NAME:
        return
    try:
        s3 = get_s3_client()
        objetos = [
            {"Key": url.split('.amazonaws.com/')[-1]}
            for url in urls_s3
        ]
        # API do S3 aceita até 1000 objetos por chamada
        for i in range(0, len(objetos), 1000):
            s3.delete_objects(
                Bucket=configuracoes.AWS_BUCKET_NAME,
                Delete={"Objects": objetos[i:i + 1000], "Quiet": True},
            )
    except Exception:
        pass  # falha silenciosa — log em produção