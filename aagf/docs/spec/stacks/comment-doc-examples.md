# comment-doc-examples

Canonical-примеры оформления комментариев для активных stack doc profiles.

## Node/TypeScript (TSDoc/TypeDoc)

<a id="node-typescript-file-header"></a>
### Пример header-блока файла

```ts
/**
 * @file src/modules/orders/orderService.ts
 * @version 1.4.0
 * @edited_at 2026-03-15 14:20
 * Сервис оркестрации операций с заказами.
 * @remarks Изменения в версии 1.4.0: добавлена валидация перехода статусов заказа.
 */
```

<a id="node-typescript-function-doc"></a>
### Пример комментария функции

```ts
/**
 * Переводит заказ в новый статус с валидацией бизнес-ограничений.
 * @param orderId Идентификатор заказа.
 * @param nextStatus Целевой статус.
 * @returns Обновленный агрегат заказа.
 * @throws Error Если переход статуса запрещен бизнес-правилами.
 * @remarks Операция должна быть идемпотентной при повторном запросе.
 * @example await transitionOrderStatus("ord_42", "paid")
 * @see transitionPolicy.ts
 * @link https://internal-wiki.example/orders/status-flow
 */
```

<a id="node-typescript-changed-block-marker"></a>
### Пример marker-комментария измененного блока

```ts
// @remarks [changed-in 1.4.0] Добавлена проверка идемпотентности перед записью статуса.
if (isDuplicateTransition(commandId)) {
  return existingOrder;
}
```

## PHP (PHPDoc)

<a id="php-file-header"></a>
### Пример header-блока файла

```php
<?php
/**
 * @file src/Domain/Orders/OrderService.php
 * @version 1.4.0
 * @edited_at 2026-03-15 14:20
 * Сервис доменной логики по жизненному циклу заказа.
 * @remarks Изменения в версии 1.4.0: добавлена проверка повторного применения команды.
 */
```

<a id="php-function-doc"></a>
### Пример комментария метода

```php
/**
 * Применяет смену статуса заказа.
 *
 * @param string $orderId Идентификатор заказа.
 * @param string $nextStatus Новый статус.
 * @returns Order Обновленная сущность заказа.
 * @throws DomainException Если переход статуса недопустим.
 * @remarks Используется для REST-операции PATCH /orders/{id}/status.
 * @example $service->transitionStatus('ord_42', 'paid');
 * @see TransitionPolicy::assertAllowed()
 * @link https://internal-wiki.example/orders/status-flow
 */
```

<a id="php-changed-block-marker"></a>
### Пример marker-комментария измененного блока

```php
// @remarks [changed-in 1.4.0] Блок предотвращает повторное применение одной команды.
if ($this->isDuplicateTransition($commandId)) {
    return $order;
}
```

## Dart (Dartdoc)

<a id="dart-file-header"></a>
### Пример header-блока файла

```dart
/// @file lib/orders/order_service.dart
/// @version 1.4.0
/// @edited_at 2026-03-15 14:20
/// Сервис управления переходами статусов заказа.
/// @remarks Изменения в версии 1.4.0: добавлена проверка повторной команды.
```

<a id="dart-function-doc"></a>
### Пример комментария функции

```dart
/// Выполняет переход заказа в новый статус.
/// @param orderId Идентификатор заказа.
/// @param nextStatus Целевой статус.
/// @returns Обновленный Order.
/// @throws StateError Если переход статуса запрещен.
/// @remarks Вызов должен быть безопасен при повторе одной команды.
/// @example await transitionOrderStatus('ord_42', 'paid');
/// @see TransitionPolicy
/// @link https://internal-wiki.example/orders/status-flow
Future<Order> transitionOrderStatus(String orderId, String nextStatus) async {
  // ...
}
```

<a id="dart-changed-block-marker"></a>
### Пример marker-комментария измененного блока

```dart
// @remarks [changed-in 1.4.0] Добавлена защита от повторного применения команды.
if (_isDuplicateTransition(commandId)) {
  return order;
}
```

## Generic (native-doc-style)

<a id="generic-file-header"></a>
### Пример header-блока файла

```text
@file src/path/to/file.ext
@version 1.4.0
@edited_at 2026-03-15 14:20
Краткое описание назначения файла.
@remarks Изменения в версии 1.4.0: описание последнего изменения.
```

<a id="generic-function-doc"></a>
### Пример комментария callable-блока

```text
Описание назначения callable-блока.
@param name описание параметра
@returns описание результата
@throws описание ошибок
@remarks ограничения и контекст использования
@example пример вызова
@see связанный API
@link ссылка на дополнительный контекст
```

<a id="generic-changed-block-marker"></a>
### Пример marker-комментария измененного блока

```text
@remarks [changed-in 1.4.0] Объяснение, что изменено и почему.
```
