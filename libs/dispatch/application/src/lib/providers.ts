// Dispatch Application Layer Providers
import { Provider } from '@angular/core';
import { DispatchWorkOrderUseCase } from './use-cases/dispatch-work-order.use-case';

export function provideDispatchUseCases(): Provider[] {
  return [
    DispatchWorkOrderUseCase
  ];
}
