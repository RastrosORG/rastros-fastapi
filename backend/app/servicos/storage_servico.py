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

def upload_arquivo(
    arquivo: UploadFile,
    pasta: str,
) -> tuple[str, str]:
    """
    Faz upload de um arquivo para o S3.
    Retorna (nome_arquivo, url_s3)
    """
    if not configuracoes.AWS_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="Bucket S3 não configurado")

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")

def deletar_arquivo(url_s3: str) -> None:
    try:
        s3 = get_s3_client()
        chave = url_s3.split('.amazonaws.com/')[-1]
        s3.delete_object(Bucket=configuracoes.AWS_BUCKET_NAME, Key=chave)
    except Exception:
        pass  # falha silenciosa — log em produção