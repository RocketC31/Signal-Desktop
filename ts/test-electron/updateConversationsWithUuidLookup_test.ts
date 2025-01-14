// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { assert } from 'chai';
import sinon from 'sinon';
import { ConversationModel } from '../models/conversations';
import type { ConversationAttributesType } from '../model-types.d';
import type { WebAPIType } from '../textsecure/WebAPI';
import { UUID } from '../types/UUID';

import { updateConversationsWithUuidLookup } from '../updateConversationsWithUuidLookup';

describe('updateConversationsWithUuidLookup', () => {
  class FakeConversationController {
    constructor(
      private readonly conversations: Array<ConversationModel> = []
    ) {}

    get(id?: string | null): ConversationModel | undefined {
      return this.conversations.find(
        conversation =>
          conversation.id === id ||
          conversation.get('e164') === id ||
          conversation.get('uuid') === id
      );
    }

    maybeMergeContacts({
      e164,
      aci: uuidFromServer,
      reason,
    }: {
      e164?: string | null;
      aci?: string | null;
      reason?: string;
    }): {
      conversation: ConversationModel | undefined;
      mergePromises: Array<Promise<void>>;
    } {
      assert(
        e164,
        'FakeConversationController is not set up for this case (E164 must be provided)'
      );
      assert(
        uuidFromServer,
        'FakeConversationController is not set up for this case (UUID must be provided)'
      );
      assert(
        reason,
        'FakeConversationController must be provided a reason when merging'
      );
      const normalizedUuid = uuidFromServer!.toLowerCase();

      const convoE164 = this.get(e164);
      const convoUuid = this.get(normalizedUuid);
      assert(
        convoE164 || convoUuid,
        'FakeConversationController is not set up for this case (at least one conversation should be found)'
      );

      if (convoE164 && convoUuid) {
        if (convoE164 === convoUuid) {
          return { conversation: convoUuid, mergePromises: [] };
        }

        convoE164.unset('e164');
        convoUuid.updateE164(e164);
        return { conversation: convoUuid, mergePromises: [] };
      }

      if (convoE164 && !convoUuid) {
        convoE164.updateUuid(normalizedUuid);
        return { conversation: convoE164, mergePromises: [] };
      }

      assert.fail('FakeConversationController should never get here');
      return { conversation: undefined, mergePromises: [] };
    }

    lookupOrCreate({
      e164,
      uuid: uuidFromServer,
    }: {
      e164?: string | null;
      uuid?: string | null;
    }): string | undefined {
      assert(
        e164,
        'FakeConversationController is not set up for this case (E164 must be provided)'
      );
      assert(
        uuidFromServer,
        'FakeConversationController is not set up for this case (UUID must be provided)'
      );
      const normalizedUuid = uuidFromServer!.toLowerCase();

      const convoE164 = this.get(e164);
      const convoUuid = this.get(normalizedUuid);
      assert(
        convoE164 || convoUuid,
        'FakeConversationController is not set up for this case (at least one conversation should be found)'
      );

      if (convoE164 && convoUuid) {
        if (convoE164 === convoUuid) {
          return convoUuid.get('id');
        }

        return convoUuid.get('id');
      }

      if (convoE164 && !convoUuid) {
        return convoE164.get('id');
      }

      assert.fail('FakeConversationController should never get here');
      return undefined;
    }
  }

  function createConversation(
    attributes: Readonly<Partial<ConversationAttributesType>> = {}
  ): ConversationModel {
    return new ConversationModel({
      id: UUID.generate().toString(),
      inbox_position: 0,
      isPinned: false,
      lastMessageDeletedForEveryone: false,
      markedUnread: false,
      messageCount: 1,
      profileSharing: true,
      sentMessageCount: 0,
      type: 'private' as const,
      version: 0,
      ...attributes,
    });
  }

  let sinonSandbox: sinon.SinonSandbox;

  let fakeCdsLookup: sinon.SinonStub;
  let fakeCheckAccountExistence: sinon.SinonStub;
  let fakeServer: Pick<WebAPIType, 'cdsLookup' | 'checkAccountExistence'>;

  beforeEach(() => {
    sinonSandbox = sinon.createSandbox();

    sinonSandbox.stub(window.Signal.Data, 'updateConversation');

    fakeCdsLookup = sinonSandbox.stub().resolves(new Map());
    fakeCheckAccountExistence = sinonSandbox.stub().resolves(false);
    fakeServer = {
      cdsLookup: fakeCdsLookup,
      checkAccountExistence: fakeCheckAccountExistence,
    };
  });

  afterEach(() => {
    sinonSandbox.restore();
  });

  it('does nothing when called with an empty array', async () => {
    await updateConversationsWithUuidLookup({
      conversationController: new FakeConversationController(),
      conversations: [],
      server: fakeServer,
    });

    sinon.assert.notCalled(fakeServer.cdsLookup as sinon.SinonStub);
  });

  it('does nothing when called with an array of conversations that lack E164s', async () => {
    await updateConversationsWithUuidLookup({
      conversationController: new FakeConversationController(),
      conversations: [
        createConversation(),
        createConversation({ uuid: UUID.generate().toString() }),
      ],
      server: fakeServer,
    });

    sinon.assert.notCalled(fakeServer.cdsLookup as sinon.SinonStub);
  });

  it('updates conversations with their UUID', async () => {
    const conversation1 = createConversation({ e164: '+13215559876' });
    const conversation2 = createConversation({
      e164: '+16545559876',
      uuid: UUID.generate().toString(), // should be overwritten
    });

    const uuid1 = UUID.generate().toString();
    const uuid2 = UUID.generate().toString();

    fakeCdsLookup.resolves(
      new Map([
        ['+13215559876', { aci: uuid1, pni: undefined }],
        ['+16545559876', { aci: uuid2, pni: undefined }],
      ])
    );

    await updateConversationsWithUuidLookup({
      conversationController: new FakeConversationController([
        conversation1,
        conversation2,
      ]),
      conversations: [conversation1, conversation2],
      server: fakeServer,
    });

    assert.strictEqual(conversation1.get('uuid'), uuid1);
    assert.strictEqual(conversation2.get('uuid'), uuid2);
  });

  it("marks conversations unregistered if we didn't have a UUID for them and the server also doesn't have one", async () => {
    const conversation = createConversation({ e164: '+13215559876' });
    assert.isUndefined(
      conversation.get('discoveredUnregisteredAt'),
      'Test was not set up correctly'
    );

    await updateConversationsWithUuidLookup({
      conversationController: new FakeConversationController([conversation]),
      conversations: [conversation],
      server: fakeServer,
    });

    assert.approximately(
      conversation.get('discoveredUnregisteredAt') || 0,
      Date.now(),
      5000
    );
  });

  it("doesn't mark conversations unregistered if we already had a UUID for them, even if the account exists on server", async () => {
    const existingUuid = UUID.generate().toString();
    const conversation = createConversation({
      e164: '+13215559876',
      uuid: existingUuid,
    });
    assert.isUndefined(
      conversation.get('discoveredUnregisteredAt'),
      'Test was not set up correctly'
    );

    fakeCheckAccountExistence.resolves(true);

    await updateConversationsWithUuidLookup({
      conversationController: new FakeConversationController([conversation]),
      conversations: [conversation],
      server: fakeServer,
    });

    assert.strictEqual(conversation.get('uuid'), existingUuid);
    assert.isUndefined(conversation.get('discoveredUnregisteredAt'));
  });

  it('marks conversations unregistered and removes UUID if the account does not exist on server', async () => {
    const existingUuid = UUID.generate().toString();
    const conversation = createConversation({
      e164: '+13215559876',
      uuid: existingUuid,
    });
    assert.isUndefined(
      conversation.get('discoveredUnregisteredAt'),
      'Test was not set up correctly'
    );

    fakeCheckAccountExistence.resolves(false);

    await updateConversationsWithUuidLookup({
      conversationController: new FakeConversationController([conversation]),
      conversations: [conversation],
      server: fakeServer,
    });

    assert.isUndefined(conversation.get('uuid'));
    assert.isNumber(conversation.get('discoveredUnregisteredAt'));
  });
});
