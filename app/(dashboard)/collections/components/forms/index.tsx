'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { IncomingCollectionItemData } from '../interfaces-incoming';
import { WebflowEventForm, WebflowEventFormRef } from './webflow-event-form';
import { WebflowNewsForm, WebflowNewsFormRef } from './webflow-news-form';
import { WebflowTeamForm, WebflowTeamFormRef } from './webflow-team-form';
import {
  WebflowProgrammeForm,
  WebflowProgrammeFormRef
} from './webflow-programme-form';
import { WebflowPostForm, WebflowPostFormRef } from './webflow-post-form';

export type CollectionType =
  | 'event'
  | 'programme'
  | 'news'
  | 'post'
  | 'source'
  | 'team'
  | 'innovation'
  | 'award'
  | 'publication'
  | 'prize'
  | 'partner';

interface CollectionFormRouterProps {
  type: CollectionType;
  initialData?: Partial<IncomingCollectionItemData>;
  onSubmit: (data: IncomingCollectionItemData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface CollectionFormRef {
  triggerSubmit: () => void;
  setStatus?: (status: 'draft' | 'published') => void;
}

export const CollectionFormRouter = forwardRef<
  CollectionFormRef,
  CollectionFormRouterProps
>(
  (
    { type, initialData, onSubmit, onCancel, onDelete, isEditing = false },
    ref
  ) => {
    const eventFormRef = React.useRef<WebflowEventFormRef>(null);
    const newsFormRef = React.useRef<WebflowNewsFormRef>(null);
    const teamFormRef = React.useRef<WebflowTeamFormRef>(null);
    const programmeFormRef = React.useRef<WebflowProgrammeFormRef>(null);
    const postFormRef = React.useRef<WebflowPostFormRef>(null);

    useImperativeHandle(ref, () => ({
      triggerSubmit: () => {
        // Handle different form types with ref support
        if (type === 'event' && eventFormRef.current) {
          eventFormRef.current.triggerSubmit();
        } else if (type === 'news' && newsFormRef.current) {
          newsFormRef.current.triggerSubmit();
        } else if (type === 'team' && teamFormRef.current) {
          teamFormRef.current.triggerSubmit();
        } else if (type === 'programme' && programmeFormRef.current) {
          programmeFormRef.current.triggerSubmit();
        } else if (type === 'post' && postFormRef.current) {
          postFormRef.current.triggerSubmit();
        }
      },
      setStatus: (status: 'draft' | 'published') => {
        // Handle different form types with setStatus support
        if (type === 'event' && eventFormRef.current) {
          eventFormRef.current.setStatus(status);
        } else if (type === 'news' && newsFormRef.current) {
          newsFormRef.current.setStatus(status);
        } else if (type === 'team' && teamFormRef.current) {
          teamFormRef.current.setStatus(status);
        } else if (type === 'programme' && programmeFormRef.current) {
          programmeFormRef.current.setStatus(status);
        } else if (type === 'post' && postFormRef.current) {
          postFormRef.current.setStatus(status);
        }
      }
    }));

    switch (type) {
      case 'event':
        return (
          <WebflowEventForm
            ref={eventFormRef}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'news':
        return (
          <WebflowNewsForm
            ref={newsFormRef}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'team':
        return (
          <WebflowTeamForm
            ref={teamFormRef}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'programme':
        return (
          <WebflowProgrammeForm
            ref={programmeFormRef}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'post':
        return (
          <WebflowPostForm
            ref={postFormRef}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'source':
      case 'innovation':
      case 'award':
      case 'publication':
      case 'prize':
      case 'partner':
        // Temporary fallback for forms that don't support the new pattern yet
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2 text-white">
              {type.charAt(0).toUpperCase() + type.slice(1)} Form
            </h2>
            <p className="text-gray-400">
              {type.charAt(0).toUpperCase() + type.slice(1)} form component is
              being updated to support the new publish/draft pattern...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              For now, please use the Event form as a reference.
            </p>
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2 text-white">
              Unknown Form Type
            </h2>
            <p className="text-gray-400">
              Form type "{type}" is not supported yet.
            </p>
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
          </div>
        );
    }
  }
);

// Export all form components for direct use if needed
export { WebflowEventForm } from './webflow-event-form';
export { WebflowNewsForm } from './webflow-news-form';
export { WebflowTeamForm } from './webflow-team-form';
export { WebflowProgrammeForm } from './webflow-programme-form';
export { WebflowPostForm } from './webflow-post-form';

CollectionFormRouter.displayName = 'CollectionFormRouter';
