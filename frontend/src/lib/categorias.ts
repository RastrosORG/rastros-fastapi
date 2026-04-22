export interface Categoria {
  id: string
  label: string
  pontos: number
  descricao: string
}

export const CATEGORIAS: Categoria[] = [
  {
    id: 'noticias',
    label: 'Sites de Notícias',
    pontos: 5,
    descricao: 'Menções ao desaparecido em sites de notícias.',
  },
  {
    id: 'amigos',
    label: 'Amigos',
    pontos: 10,
    descricao:
      '1 - Perfis de amigos em Mídias Sociais, interagindo com o alvo;\n' +
      '2 - Interações e fotos relevantes em Mídias Sociais;\n' +
      '3 - Comentários de amigos mostrando preocupação ou mencionando desaparecimento.',
  },
  {
    id: 'empregos',
    label: 'Empregos',
    pontos: 15,
    descricao:
      '1 - Nome do atual ou de antigo empregador;\n' +
      '2 - Endereço do atual ou de antigo empregador;\n' +
      '3 - Informações sobre o comportamento do alvo no trabalho, seus sentimentos sobre o empregador e o ambiente de trabalho, etc.',
  },
  {
    id: 'familia',
    label: 'Família',
    pontos: 20,
    descricao:
      '1 - Perfis de Mídia Social de familiares relevantes;\n' +
      '2 - Comentários em Mídias Sociais de familiares relevantes;\n' +
      '3 - Quaisquer outras informações de familiares que sejam relevantes para a investigação.',
  },
  {
    id: 'info_basicas',
    label: 'Informações Básicas',
    pontos: 50,
    descricao:
      '1 - Apelidos ou abreviações;\n' +
      '2 - Fotos relevantes:\n' +
      '   A - Diferentes cortes de cabelo;\n' +
      '   B - Formas de se vestir;\n' +
      '   C - Outras características físicas não mencionadas no Report inicial;\n' +
      '3 - Perfis e posts relevantes em fóruns;\n' +
      '4 - Perfis e posts em sites de relacionamento;\n' +
      '5 - Perfis de Mídias Sociais:\n' +
      '   A - Facebook;\n' +
      '   B - Twitter;\n' +
      '   C - TikTok;\n' +
      '   D - Reddit;\n' +
      '   E - Instagram;\n' +
      '   F - LinkedIn;\n' +
      '   G - Github;\n' +
      '   H - Sites adultos;\n' +
      '   I - Gaming;\n' +
      '   J - Etsy;\n' +
      '   K - Pinterest;\n' +
      '6 - Website pessoal ou blog;\n' +
      '7 - Endereços de email;\n' +
      '8 - Outras que possam ser relevantes para investigação.',
  },
  {
    id: 'info_avancadas',
    label: 'Informações Avançadas',
    pontos: 100,
    descricao:
      '1 - Características físicas únicas:\n' +
      '   A - Tatuagens;\n' +
      '   B - Piercings;\n' +
      '   C - Cicatrizes;\n' +
      '2 - Condições médicas físicas ou psicológicas;\n' +
      '3 - Qualquer informação sobre onde o alvo poderia ter ido:\n' +
      '   A - Posts de mídia social, interações de mídia social ou lembranças de amigos/família;\n' +
      '4 - Placas de veículos;\n' +
      '5 - Marca e modelo de veículo em que o alvo pode ter viajado;\n' +
      '6 - Histórico de desaparecimento anterior:\n' +
      '   A - Notícias sobre outros desaparecimentos e retornos;\n' +
      '7 - Evidências de que tenha falecido;\n' +
      '8 - Evidências de que não esteja mais desaparecido.',
  },
  {
    id: 'dia_desaparecimento',
    label: 'Dia do Desaparecimento',
    pontos: 300,
    descricao:
      '1 - Detalhes sobre a aparência física do alvo no dia do desaparecimento:\n' +
      '   A - Roupas;\n' +
      '   B - Cabelo, etc.;\n' +
      '2 - Detalhes sobre o estado psicológico do alvo no dia do desaparecimento:\n' +
      '   A - Humor;\n' +
      '   B - Alterações;\n' +
      '   C - Conversas;\n' +
      '3 - Qualquer outro detalhe relevante sobre o dia do desaparecimento.',
  },
  {
    id: 'atividades_pos',
    label: 'Atividades Pós-Desaparecimento',
    pontos: 700,
    descricao:
      '1 - Atividade em Mídias Sociais (incluindo personas) exclusivamente controladas pelo alvo, depois do desaparecimento;\n' +
      '2 - Informações de localização aproximada (entre a data do desaparecimento até o dia de hoje);\n' +
      '3 - Criação de contas;\n' +
      '4 - Imagens de CCTV.',
  },
  {
    id: 'darkweb',
    label: 'Dark Web',
    pontos: 1000,
    descricao:
      '1 - Tem que serem sites .onion;\n' +
      '2 - Imagens ou detalhes do alvo em sites de tráfico de pessoas;\n' +
      '3 - Venda de bens do alvo;\n' +
      '4 - Qualquer atividade ou post do alvo em fóruns.',
  },
  {
    id: 'localizacao',
    label: 'Localização',
    pontos: 5000,
    descricao:
      '1 - Localização ou endereço exato onde o alvo tenha estado ou estará em 24h;\n' +
      '2 - Tem de ter certeza. Sem especulações.',
  },
]

export function labelCategoria(id: string): string {
  return CATEGORIAS.find(c => c.id === id)?.label ?? id
}

export function pontosCategoria(id: string): number {
  return CATEGORIAS.find(c => c.id === id)?.pontos ?? 0
}
