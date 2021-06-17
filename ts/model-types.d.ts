// Copyright 2020-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import * as Backbone from 'backbone';

import { GroupV2ChangeType } from './groups';
import { LocalizerType, BodyRangeType, BodyRangesType } from './types/Util';
import { CallHistoryDetailsFromDiskType } from './types/Calling';
import { CustomColorType } from './types/Colors';
import { DeviceType } from './textsecure/Types';
import { SendOptionsType } from './textsecure/SendMessage';
import { SendMessageChallengeData } from './textsecure/Errors';
import {
  AccessRequiredEnum,
  MemberRoleEnum,
  SyncMessageClass,
} from './textsecure.d';
import { UserMessage } from './types/Message';
import { MessageModel } from './models/messages';
import { ConversationModel } from './models/conversations';
import { ProfileNameChangeType } from './util/getStringForProfileChange';
import { CapabilitiesType } from './textsecure/WebAPI';
import { GroupNameCollisionsWithIdsByTitle } from './util/groupMemberNameCollisions';
import { ConversationColorType } from './types/Colors';
import { AttachmentType, ThumbnailType } from './types/Attachment';
import { ContactType } from './types/Contact';

export type WhatIsThis = any;

export type LastMessageStatus =
  | 'paused'
  | 'error'
  | 'partial-sent'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read';

type TaskResultType = any;

export type CustomError = Error & {
  identifier?: string;
  number?: string;
  data?: object;
  retryAfter?: number;
};

export type GroupMigrationType = {
  areWeInvited: boolean;
  droppedMemberIds: Array<string>;
  invitedMembers: Array<GroupV2PendingMemberType>;
};

export type QuotedMessageType = {
  attachments: Array<typeof window.WhatIsThis>;
  // `author` is an old attribute that holds the author's E164. We shouldn't use it for
  //   new messages, but old messages might have this attribute.
  author?: string;
  authorUuid: string;
  bodyRanges: BodyRangesType;
  id: string;
  referencedMessageNotFound: boolean;
  isViewOnce: boolean;
  text: string;
};

export type RetryOptions = Readonly<{
  type: 'session-reset';
  uuid: string;
  e164: string;
  now: number;
}>;

export type MessageAttributesType = {
  bodyPending?: boolean;
  bodyRanges?: BodyRangesType;
  callHistoryDetails?: CallHistoryDetailsFromDiskType;
  changedId?: string;
  dataMessage?: ArrayBuffer | null;
  decrypted_at?: number;
  deletedForEveryone?: boolean;
  deletedForEveryoneTimestamp?: number;
  delivered?: number;
  delivered_to?: Array<string | null>;
  errors?: Array<CustomError>;
  expirationStartTimestamp?: number | null;
  expireTimer?: number;
  groupMigration?: GroupMigrationType;
  group_update?: {
    avatarUpdated: boolean;
    joined: Array<string>;
    left: string | 'You';
    name: string;
  };
  hasAttachments?: boolean;
  hasFileAttachments?: boolean;
  hasVisualMediaAttachments?: boolean;
  isErased?: boolean;
  isTapToViewInvalid?: boolean;
  isViewOnce?: boolean;
  key_changed?: string;
  local?: boolean;
  logger?: unknown;
  message?: unknown;
  messageTimer?: unknown;
  profileChange?: ProfileNameChangeType;
  quote?: QuotedMessageType;
  reactions?: Array<{
    emoji: string;
    fromId: string;
    targetAuthorUuid: string;
    targetTimestamp: number;
    timestamp: number;
  }>;
  read_by?: Array<string | null>;
  requiredProtocolVersion?: number;
  retryOptions?: RetryOptions;
  sent?: boolean;
  sourceDevice?: string | number;
  supportedVersionAtReceive?: unknown;
  synced?: boolean;
  unidentifiedDeliveryReceived?: boolean;
  verified?: boolean;
  verifiedChanged?: string;

  id: string;
  type:
    | 'call-history'
    | 'chat-session-refreshed'
    | 'delivery-issue'
    | 'group'
    | 'group-v1-migration'
    | 'group-v2-change'
    | 'incoming'
    | 'keychange'
    | 'message-history-unsynced'
    | 'outgoing'
    | 'profile-change'
    | 'timer-notification'
    | 'universal-timer-notification'
    | 'verified-change';
  body?: string;
  attachments?: Array<AttachmentType>;
  preview?: Array<WhatIsThis>;
  sticker?: {
    packId: string;
    stickerId: number;
    packKey: string;
    data?: AttachmentType;
  };
  sent_at: number;
  sent_to?: Array<string>;
  unidentifiedDeliveries?: Array<string>;
  contact?: Array<ContactType>;
  conversationId: string;
  recipients?: Array<string>;
  reaction?: WhatIsThis;
  destination?: WhatIsThis;
  destinationUuid?: string;

  expirationTimerUpdate?: {
    expireTimer: number;
    fromSync?: unknown;
    source?: string;
    sourceUuid?: string;
  };
  // Legacy fields for timer update notification only
  flags?: number;
  groupV2Change?: GroupV2ChangeType;
  // Required. Used to sort messages in the database for the conversation timeline.
  received_at: number;
  received_at_ms?: number;
  // More of a legacy feature, needed as we were updating the schema of messages in the
  //   background, when we were still in IndexedDB, before attachments had gone to disk
  // We set this so that the idle message upgrade process doesn't pick this message up
  schemaVersion?: number;
  // This should always be set for new messages, but older messages may not have them. We
  //   may not have these for outbound messages, either, as we have not needed them.
  serverGuid?: string;
  serverTimestamp?: number;
  source?: string;
  sourceUuid?: string;

  unread?: boolean;
  timestamp: number;

  // Backwards-compatibility with prerelease data schema
  invitedGV2Members?: Array<GroupV2PendingMemberType>;
  droppedGV2MemberIds?: Array<string>;
};

export type ConversationAttributesTypeType = 'private' | 'group';

export type ConversationAttributesType = {
  accessKey?: string | null;
  addedBy?: string;
  capabilities?: CapabilitiesType;
  color?: string;
  conversationColor?: ConversationColorType;
  customColor?: CustomColorType;
  customColorId?: string;
  discoveredUnregisteredAt?: number;
  draftAttachments?: Array<{
    path?: string;
    screenshotPath?: string;
  }>;
  draftBodyRanges?: Array<BodyRangeType>;
  draftTimestamp?: number | null;
  inbox_position: number;
  isPinned: boolean;
  lastMessageDeletedForEveryone: boolean;
  lastMessageStatus?: LastMessageStatus | null;
  markedUnread: boolean;
  messageCount: number;
  messageCountBeforeMessageRequests?: number | null;
  messageRequestResponseType?: number;
  muteExpiresAt?: number;
  profileAvatar?: null | {
    hash: string;
    path: string;
  };
  profileKeyCredential?: string | null;
  profileKeyVersion?: string | null;
  quotedMessageId?: string | null;
  sealedSender?: unknown;
  sentMessageCount: number;
  sharedGroupNames?: Array<string>;

  id: string;
  type: ConversationAttributesTypeType;
  timestamp?: number | null;

  // Shared fields
  active_at?: number | null;
  draft?: string | null;
  isArchived?: boolean;
  lastMessage?: string | null;
  name?: string;
  needsStorageServiceSync?: boolean;
  needsVerification?: boolean;
  profileSharing: boolean;
  storageID?: string;
  storageUnknownFields?: string;
  unreadCount?: number;
  version: number;

  // Private core info
  uuid?: string;
  e164?: string;

  // Private other fields
  about?: string;
  aboutEmoji?: string;
  profileFamilyName?: string;
  profileKey?: string;
  profileName?: string;
  verified?: number;
  profileLastFetchedAt?: number;
  pendingUniversalTimer?: string;

  // Group-only
  groupId?: string;
  // A shorthand, representing whether the user is part of the group. Not strictly for
  //   when the user manually left the group. But historically, that was the only way
  //   to leave a group.
  left?: boolean;
  groupVersion?: number;

  // GroupV1 only
  members?: Array<string>;
  derivedGroupV2Id?: string;

  // GroupV2 core info
  masterKey?: string;
  secretParams?: string;
  publicParams?: string;
  revision?: number;
  senderKeyInfo?: {
    createdAtDate: number;
    distributionId: string;
    memberDevices: Array<DeviceType>;
  };

  // GroupV2 other fields
  accessControl?: {
    attributes: AccessRequiredEnum;
    members: AccessRequiredEnum;
    addFromInviteLink: AccessRequiredEnum;
  };
  avatar?: {
    url: string;
    path: string;
    hash?: string;
  } | null;
  description?: string;
  expireTimer?: number;
  membersV2?: Array<GroupV2MemberType>;
  pendingMembersV2?: Array<GroupV2PendingMemberType>;
  pendingAdminApprovalV2?: Array<GroupV2PendingAdminApprovalType>;
  groupInviteLinkPassword?: string;
  previousGroupV1Id?: string;
  previousGroupV1Members?: Array<string>;
  acknowledgedGroupNameCollisions?: GroupNameCollisionsWithIdsByTitle;

  // Used only when user is waiting for approval to join via link
  isTemporary?: boolean;
  temporaryMemberCount?: number;

  // Avatars are blurred for some unapproved conversations, but users can manually unblur
  //   them. If the avatar was unblurred and then changed, we don't update this value so
  //   the new avatar gets blurred.
  //
  // This value is useless once the message request has been approved. We don't clean it
  //   up but could. We don't persist it but could (though we'd probably want to clean it
  //   up in that case).
  unblurredAvatarPath?: string;
};

export type GroupV2MemberType = {
  conversationId: string;
  role: MemberRoleEnum;
  joinedAtVersion: number;

  // Note that these are temporary flags, generated by applyGroupChange, but eliminated
  //   by applyGroupState. They are used to make our diff-generation more intelligent but
  //   not after that.
  joinedFromLink?: boolean;
  approvedByAdmin?: boolean;
};

export type GroupV2PendingMemberType = {
  addedByUserId?: string;
  conversationId: string;
  timestamp: number;
  role: MemberRoleEnum;
};

export type GroupV2PendingAdminApprovalType = {
  conversationId: string;
  timestamp: number;
};

export type VerificationOptions = {
  key?: null | ArrayBuffer;
  viaContactSync?: boolean;
  viaStorageServiceSync?: boolean;
  viaSyncMessage?: boolean;
};

export type ShallowChallengeError = CustomError & {
  readonly retryAfter: number;
  readonly data: SendMessageChallengeData;
};

export declare class ConversationModelCollectionType extends Backbone.Collection<ConversationModel> {
  resetLookups(): void;
}

export declare class MessageModelCollectionType extends Backbone.Collection<MessageModel> {}

export type ReactionAttributesType = {
  emoji: string;
  remove?: boolean;
  targetAuthorUuid: string;
  targetTimestamp: number;
  fromId?: string;
  timestamp: number;
  fromSync?: boolean;
};

export declare class ReactionModelType extends Backbone.Model<ReactionAttributesType> {}
