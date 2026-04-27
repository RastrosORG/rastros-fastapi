from collections import defaultdict
from sqlalchemy.orm import Session, selectinload

from app.modelos.grupo import Grupo
from app.modelos.cronometro import Cronometro


def listar_ranking_completo(db: Session) -> dict:
    grupos = db.query(Grupo).options(selectinload(Grupo.respostas)).all()

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
    desempenho_buckets: dict = defaultdict(lambda: defaultdict(int))
    max_bucket_10 = 0
    max_bucket_1 = 0

    if inicio:
        for g in grupos:
            nome = nomes[g.id]
            for r in g.respostas:
                delta = (r.criado_em - inicio).total_seconds() / 60
                if delta >= 0:
                    bucket_10 = int(delta // 10) * 10
                    bucket_1 = int(delta)
                    max_bucket_10 = max(max_bucket_10, bucket_10)
                    max_bucket_1 = max(max_bucket_1, bucket_1)
                    atividade_buckets[bucket_10][nome] += 1
                    if r.pontos > 0:
                        desempenho_buckets[bucket_1][nome] += r.pontos

                if r.avaliado_em and r.pontos > 0:
                    delta_av = (r.avaliado_em - inicio).total_seconds() / 60
                    if delta_av >= 0:
                        bucket_av = int(delta_av // 10) * 10
                        max_bucket_10 = max(max_bucket_10, bucket_av)
                        evolucao_buckets[bucket_av][nome] += r.pontos

    buckets_10 = list(range(0, max_bucket_10 + 10, 10)) if max_bucket_10 > 0 else [0]
    buckets_1  = list(range(0, max_bucket_1 + 2))       if max_bucket_1  > 0 else [0]

    # Atividade acumulada (10 min)
    atividade_result = []
    acum_at = {nome: 0 for nome in todos_nomes}
    for b in buckets_10:
        for nome in todos_nomes:
            acum_at[nome] += atividade_buckets[b].get(nome, 0)
        atividade_result.append({"rotulo": f"{b}min", "dados": dict(acum_at)})

    # Evolução acumulada (10 min)
    evolucao_result = []
    acum_ev = {nome: 0 for nome in todos_nomes}
    for b in buckets_10:
        for nome in todos_nomes:
            acum_ev[nome] += evolucao_buckets[b].get(nome, 0)
        evolucao_result.append({"rotulo": f"{b}min", "dados": dict(acum_ev)})

    # Desempenho acumulado — por minuto
    desempenho_result = []
    acum_de = {nome: 0 for nome in todos_nomes}
    for b in buckets_1:
        for nome in todos_nomes:
            acum_de[nome] += desempenho_buckets[b].get(nome, 0)
        desempenho_result.append({"rotulo": f"{b}min", "dados": dict(acum_de)})

    return {
        "ranking": ranking,
        "atividade": atividade_result,
        "evolucao": evolucao_result,
        "desempenho": desempenho_result,
    }
