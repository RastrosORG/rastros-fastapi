from collections import defaultdict
from sqlalchemy.orm import Session

from app.modelos.grupo import Grupo
from app.modelos.cronometro import Cronometro


def listar_ranking_completo(db: Session) -> dict:
    grupos = db.query(Grupo).all()

    # Mapa grupo_id → nome de exibição
    nomes = {g.id: (g.nome_custom or g.nome) for g in grupos}

    # ── Ranking ──────────────────────────────────────────────────────
    ranking = []
    for g in grupos:
        respostas = g.respostas
        ranking.append({
            "grupo_id": g.id,
            "nome": nomes[g.id],
            "pontos": sum(r.pontos for r in respostas),
            "respostas": len(respostas),
            "aprovadas": sum(1 for r in respostas if r.status == "aprovada"),
            "rejeitadas": sum(1 for r in respostas if r.status == "rejeitada"),
            "parciais": sum(1 for r in respostas if r.status == "aprovada_parcial"),
        })

    ranking.sort(key=lambda x: x["pontos"], reverse=True)

    # ── Dados temporais ──────────────────────────────────────────────
    cronometro = db.query(Cronometro).filter(Cronometro.id == 1).first()
    inicio = cronometro.iniciado_em if cronometro and cronometro.iniciado_em else None

    todos_nomes = list(nomes.values())
    atividade_buckets: dict = defaultdict(lambda: defaultdict(int))
    evolucao_buckets: dict = defaultdict(lambda: defaultdict(int))
    max_bucket = 0

    if inicio:
        for g in grupos:
            nome = nomes[g.id]
            for r in g.respostas:
                # Atividade: intervalo de criação da resposta
                delta = (r.criado_em - inicio).total_seconds() / 60
                if delta >= 0:
                    bucket = int(delta // 10) * 10
                    max_bucket = max(max_bucket, bucket)
                    atividade_buckets[bucket][nome] += 1

                # Evolução: intervalo da avaliação (só respostas pontuadas)
                if r.avaliado_em and r.pontos > 0:
                    delta_av = (r.avaliado_em - inicio).total_seconds() / 60
                    if delta_av >= 0:
                        bucket_av = int(delta_av // 10) * 10
                        max_bucket = max(max_bucket, bucket_av)
                        evolucao_buckets[bucket_av][nome] += r.pontos

    buckets = list(range(0, max_bucket + 10, 10)) if max_bucket > 0 else [0]

    # Atividade acumulada
    atividade_result = []
    acum_at = {nome: 0 for nome in todos_nomes}
    for b in buckets:
        for nome in todos_nomes:
            acum_at[nome] += atividade_buckets[b].get(nome, 0)
        atividade_result.append({"rotulo": f"{b}min", "dados": dict(acum_at)})

    # Evolução acumulada
    evolucao_result = []
    acum_ev = {nome: 0 for nome in todos_nomes}
    for b in buckets:
        for nome in todos_nomes:
            acum_ev[nome] += evolucao_buckets[b].get(nome, 0)
        evolucao_result.append({"rotulo": f"{b}min", "dados": dict(acum_ev)})

    return {
        "ranking": ranking,
        "atividade": atividade_result,
        "evolucao": evolucao_result,
    }
