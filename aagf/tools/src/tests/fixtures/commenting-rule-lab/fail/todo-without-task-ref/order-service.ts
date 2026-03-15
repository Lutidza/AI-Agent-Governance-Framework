/**
 * @file tools/src/tests/fixtures/commenting-rule-lab/fail/todo-without-task-ref/order-service.ts
 * @version 1.0.0
 * @edited_at 2026-03-15 19:20
 * Негативный пример: TODO без ссылки на задачу.
 * @remarks Изменения в версии 1.0.0: создан пример для проверки policy TODO/FIXME.
 */
export type OrderStatus = "created" | "paid";

/**
 * Переводит заказ в новый статус.
 * @param orderId Идентификатор заказа.
 * @param nextStatus Целевой статус.
 * @returns Комбинированный ключ заказа и статуса.
 * @remarks Комментарий функции корректный, ошибка только в TODO ниже.
 */
export function transitionOrderStatus(orderId: string, nextStatus: OrderStatus): string {
  // TODO уточнить кэширование статуса в отдельном слое
  return `${orderId}:${nextStatus}`;
}
