from pydantic_settings import BaseSettings

class Configuracoes(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = ""
    AWS_REGION: str = "us-east-1"

    CHAVE_CADASTRO_AVALIADOR: str = ""

    # Lista de origens permitidas separadas por vírgula
    # Ex: "http://localhost:5173,https://rastros.onrender.com"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

configuracoes = Configuracoes()