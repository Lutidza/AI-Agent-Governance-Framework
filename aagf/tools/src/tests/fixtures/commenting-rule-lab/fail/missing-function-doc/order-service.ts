/**
 * @file tools/src/tests/fixtures/commenting-rule-lab/fail/missing-function-doc/order-service.ts
 * @version 1.0.0
 * @edited_at 2026-03-15 19:20
 * Негативный пример: отсутствует комментарий у функции.
 * @remarks Изменения в версии 1.0.0: создан пример для проверки missing-function-doc.
 */
export type OrderStatus = "created" | "paid";

export function transitionOrderStatus(orderId: string, nextStatus: OrderStatus): string {
  return `${orderId}:${nextStatus}`;
}
