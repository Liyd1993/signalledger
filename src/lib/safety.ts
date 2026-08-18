const riskPhrases = ['自杀', '结束生命', '伤害自己', '伤害他人', '想杀人']

export const isRiskMessage = (text: string) => riskPhrases.some((phrase) => text.includes(phrase))
