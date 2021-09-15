// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { debounce, isNumber } from 'lodash';

import { strictAssert } from './assert';
import Data from '../sql/Client';

let receivedAtCounter: number | undefined;

export async function initializeMessageCounter(): Promise<void> {
  strictAssert(
    receivedAtCounter === undefined,
    'incrementMessageCounter: already initialized'
  );

  const storedCounter = Number(localStorage.getItem('lastReceivedAtCounter'));
  const dbCounter = await Data.getMaxMessageCounter();

  if (isNumber(dbCounter) && isNumber(storedCounter)) {
    window.log.info(
      'initializeMessageCounter: picking max of db/stored counters'
    );
    receivedAtCounter = Math.max(dbCounter, storedCounter);

    if (receivedAtCounter !== storedCounter) {
      window.log.warn(
        'initializeMessageCounter: mismatch between db/stored counters'
      );
    }
  } else if (isNumber(storedCounter)) {
    window.log.info('initializeMessageCounter: picking stored counter');
    receivedAtCounter = storedCounter;
  } else if (isNumber(dbCounter)) {
    window.log.info(
      'initializeMessageCounter: picking fallback counter from the database'
    );
    receivedAtCounter = dbCounter;
  } else {
    window.log.info('initializeMessageCounter: defaulting to Date.now()');
    receivedAtCounter = Date.now();
  }

  if (storedCounter !== receivedAtCounter) {
    localStorage.setItem('lastReceivedAtCounter', String(receivedAtCounter));
  }
}

export function incrementMessageCounter(): number {
  strictAssert(
    receivedAtCounter !== undefined,
    'incrementMessageCounter: not initialized'
  );

  receivedAtCounter += 1;
  debouncedUpdateLastReceivedAt();

  return receivedAtCounter;
}

export function flushMessageCounter(): void {
  debouncedUpdateLastReceivedAt.flush();
}

const debouncedUpdateLastReceivedAt = debounce(
  () => {
    localStorage.setItem('lastReceivedAtCounter', String(receivedAtCounter));
  },
  25,
  {
    maxWait: 25,
  }
);
