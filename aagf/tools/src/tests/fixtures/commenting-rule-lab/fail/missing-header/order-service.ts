export type OrderStatus = "created" | "paid";

/**
 * Переводит заказ в новый статус.
 * @param orderId Идентификатор заказа.
 * @param nextStatus Целевой статус.
 * @returns Комбинированный ключ заказа и статуса.
 * @remarks Комментарий функции есть, но header блока файла нет.
 */
export function transitionOrderStatus(orderId: string, nextStatus: OrderStatus): string {
  return `${orderId}:${nextStatus}`;
}
