/**
 * @file tools/src/tests/fixtures/commenting-rule-lab/pass/valid-service.ts
 * @version 1.0.0
 * @edited_at 2026-03-15 19:20
 * Валидный пример файла для проверки правила оформления комментариев.
 * @remarks Изменения в версии 1.0.0: создан базовый валидный пример.
 */
export type OrderStatus = "created" | "paid";

/**
 * Переводит заказ в новый статус.
 * @param orderId Идентификатор заказа.
 * @param nextStatus Целевой статус.
 * @returns Комбинированный ключ заказа и статуса.
 * @remarks Используется как эталон корректного doc-комментария.
 */
export function transitionOrderStatus(orderId: string, nextStatus: OrderStatus): string {
  return `${orderId}:${nextStatus}`;
}
