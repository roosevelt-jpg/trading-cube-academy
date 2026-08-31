export const QUESTION_ORDER_KEY = '__questionOrder'

export function shuffleQuestionIds(ids: string[]): string[] {
  const arr = [...ids]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function encodeQuestionOrder(ids: string[]): string {
  return ids.join(',')
}

export function decodeQuestionOrder(value: string | undefined | null): string[] | null {
  if (!value) return null
  const ids = value.split(',').filter(Boolean)
  return ids.length ? ids : null
}

export function orderQuestions<T extends { id: string }>(questions: T[], orderIds: string[] | null): T[] {
  if (!orderIds?.length) return questions
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]))
  const ordered = orderIds.map((id) => byId[id]).filter(Boolean) as T[]
  const missing = questions.filter((q) => !orderIds.includes(q.id))
  return [...ordered, ...missing]
}

export function stripQuizMeta(answers: Record<string, string>): Record<string, string> {
  const { [QUESTION_ORDER_KEY]: _, ...rest } = answers
  return rest
}

export function mergeQuizAnswers(
  existing: Record<string, string> | null | undefined,
  incoming: Record<string, string>,
): Record<string, string> {
  const order = existing?.[QUESTION_ORDER_KEY]
  if (!order) return incoming
  return { ...incoming, [QUESTION_ORDER_KEY]: order }
}
