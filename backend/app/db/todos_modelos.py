# Importa todos os modelos para o Alembic detectar
# Esse arquivo é importado apenas pelo env.py do Alembic
from app.modelos.usuario import Usuario
from app.modelos.grupo import Grupo, MembroGrupo
from app.modelos.dossie import Dossie, ArquivoDossie
from app.modelos.resposta import Resposta, ArquivoResposta
from app.modelos.cronometro import Cronometro
from app.modelos.mensagem import Mensagem
from app.modelos.log_exclusao import LogExclusaoDossie
from app.modelos.log_exclusao_usuario import LogExclusaoUsuario