import { storageService } from './storage';
import { apiService } from './api';
import { DispositivoPayload, QueuedDeviceAction } from '../types/app';

function actionId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function upsertAction(queue: QueuedDeviceAction[], nextAction: QueuedDeviceAction) {
  return [...queue.filter((item) => item.id !== nextAction.id), nextAction].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  );
}

export const offlineService = {
  buildTempId() {
    return `temp-${Date.now()}`;
  },

  async queueCreate(targetId: string, payload: DispositivoPayload) {
    const queue = await storageService.loadQueue();
    const existingCreate = queue.find(
      (item) => item.targetId === targetId && item.type === 'create'
    );

    const nextAction: QueuedDeviceAction = {
      createdAt: existingCreate?.createdAt ?? new Date().toISOString(),
      id: existingCreate?.id ?? actionId(),
      payload,
      targetId,
      type: 'create',
    };

    await storageService.saveQueue(upsertAction(queue, nextAction));
  },

  async queueDelete(targetId: string) {
    const queue = await storageService.loadQueue();
    const hasPendingCreate = queue.some(
      (item) => item.targetId === targetId && item.type === 'create'
    );

    const cleanedQueue = queue.filter((item) => item.targetId !== targetId);
    if (hasPendingCreate) {
      await storageService.saveQueue(cleanedQueue);
      return;
    }

    const nextAction: QueuedDeviceAction = {
      createdAt: new Date().toISOString(),
      id: actionId(),
      targetId,
      type: 'delete',
    };

    await storageService.saveQueue(upsertAction(cleanedQueue, nextAction));
  },

  async queueUpdate(targetId: string, payload: DispositivoPayload) {
    const queue = await storageService.loadQueue();
    const existingCreate = queue.find(
      (item) => item.targetId === targetId && item.type === 'create'
    );

    if (existingCreate) {
      existingCreate.payload = payload;
      await storageService.saveQueue(
        upsertAction(queue.filter((item) => item.id !== existingCreate.id), existingCreate)
      );
      return;
    }

    const existingUpdate = queue.find(
      (item) => item.targetId === targetId && item.type === 'update'
    );

    const nextAction: QueuedDeviceAction = {
      createdAt: existingUpdate?.createdAt ?? new Date().toISOString(),
      id: existingUpdate?.id ?? actionId(),
      payload,
      targetId,
      type: 'update',
    };

    await storageService.saveQueue(upsertAction(queue, nextAction));
  },

  async syncPendingDeviceActions() {
    const queue = await storageService.loadQueue();
    if (!queue.length) {
      return true;
    }

    const tempIdMap = new Map<string, string>();
    const remainingActions: QueuedDeviceAction[] = [];

    for (let index = 0; index < queue.length; index += 1) {
      const action = queue[index];

      try {
        if (action.type === 'create' && action.payload) {
          const createdDevice = await apiService.createDispositivo(action.payload);
          tempIdMap.set(action.targetId, createdDevice.id);
          continue;
        }

        const resolvedId = tempIdMap.get(action.targetId) ?? action.targetId;

        if (action.type === 'update' && action.payload) {
          await apiService.updateDispositivo(resolvedId, action.payload);
          continue;
        }

        if (action.type === 'delete' && !resolvedId.startsWith('temp-')) {
          await apiService.deleteDispositivo(resolvedId);
        }
      } catch {
        remainingActions.push(...queue.slice(index));
        break;
      }
    }

    await storageService.saveQueue(remainingActions);
    return remainingActions.length === 0;
  },
};