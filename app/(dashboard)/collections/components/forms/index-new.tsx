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
import {
  WebflowPartnerForm,
  WebflowPartnerFormRef
} from './webflow-partner-form';
import { WebflowPeopleForm, WebflowPeopleFormRef } from './webflow-people-form';
import { WebflowTagForm, WebflowTagFormRef } from './webflow-tag-form';
import { WebflowSourceForm, WebflowSourceFormRef } from './webflow-source-form';
import {
  WebflowInnovationForm,
  WebflowInnovationFormRef
} from './webflow-innovation-form';
import { WebflowAwardForm, WebflowAwardFormRef } from './webflow-award-form';
import {
  WebflowPublicationForm,
  WebflowPublicationFormRef
} from './webflow-publication-form';
import { WebflowPrizeForm, WebflowPrizeFormRef } from './webflow-prize-form';

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
  | 'partner'
  | 'people'
  | 'tag';

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
    const partnerFormRef = React.useRef<WebflowPartnerFormRef>(null);
    const peopleFormRef = React.useRef<WebflowPeopleFormRef>(null);
    const tagFormRef = React.useRef<WebflowTagFormRef>(null);
    const sourceFormRef = React.useRef<WebflowSourceFormRef>(null);
    const innovationFormRef = React.useRef<WebflowInnovationFormRef>(null);
    const awardFormRef = React.useRef<WebflowAwardFormRef>(null);
    const publicationFormRef = React.useRef<WebflowPublicationFormRef>(null);
    const prizeFormRef = React.useRef<WebflowPrizeFormRef>(null);

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
        } else if (type === 'partner' && partnerFormRef.current) {
          partnerFormRef.current.triggerSubmit();
        } else if (type === 'people' && peopleFormRef.current) {
          peopleFormRef.current.triggerSubmit();
        } else if (type === 'tag' && tagFormRef.current) {
          tagFormRef.current.triggerSubmit();
        } else if (type === 'source' && sourceFormRef.current) {
          sourceFormRef.current.triggerSubmit();
        } else if (type === 'innovation' && innovationFormRef.current) {
          innovationFormRef.current.triggerSubmit();
        } else if (type === 'award' && awardFormRef.current) {
          awardFormRef.current.triggerSubmit();
        } else if (type === 'publication' && publicationFormRef.current) {
          publicationFormRef.current.triggerSubmit();
        } else if (type === 'prize' && prizeFormRef.current) {
          prizeFormRef.current.triggerSubmit();
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
        } else if (type === 'partner' && partnerFormRef.current) {
          partnerFormRef.current.setStatus(status);
        } else if (type === 'people' && peopleFormRef.current) {
          peopleFormRef.current.setStatus(status);
        } else if (type === 'tag' && tagFormRef.current) {
          tagFormRef.current.setStatus(status);
        } else if (type === 'source' && sourceFormRef.current) {
          sourceFormRef.current.setStatus(status);
        } else if (type === 'innovation' && innovationFormRef.current) {
          innovationFormRef.current.setStatus(status);
        } else if (type === 'award' && awardFormRef.current) {
          awardFormRef.current.setStatus(status);
        } else if (type === 'publication' && publicationFormRef.current) {
          publicationFormRef.current.setStatus(status);
        } else if (type === 'prize' && prizeFormRef.current) {
          prizeFormRef.current.setStatus(status);
        }
      }
    }));

    switch (type) {
      case 'event':
        return (
          <WebflowEventForm
            ref={eventFormRef}
            initialData={initialData as any}
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
            initialData={initialData as any}
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
            initialData={initialData as any}
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
            initialData={initialData as any}
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
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'partner':
        return (
          <WebflowPartnerForm
            ref={partnerFormRef}
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'people':
        return (
          <WebflowPeopleForm
            ref={peopleFormRef}
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'tag':
        return (
          <WebflowTagForm
            ref={tagFormRef}
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'source':
        return (
          <WebflowSourceForm
            ref={sourceFormRef}
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'innovation':
        return (
          <WebflowInnovationForm
            ref={innovationFormRef}
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'award':
        return (
          <WebflowAwardForm
            ref={awardFormRef}
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'publication':
        return (
          <WebflowPublicationForm
            ref={publicationFormRef}
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
        );

      case 'prize':
        return (
          <WebflowPrizeForm
            ref={prizeFormRef}
            initialData={initialData as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onDelete={onDelete}
            isEditing={isEditing}
          />
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
export { WebflowPartnerForm } from './webflow-partner-form';
export { WebflowPeopleForm } from './webflow-people-form';
export { WebflowTagForm } from './webflow-tag-form';
export { WebflowSourceForm } from './webflow-source-form';
export { WebflowInnovationForm } from './webflow-innovation-form';
export { WebflowAwardForm } from './webflow-award-form';
export { WebflowPublicationForm } from './webflow-publication-form';
export { WebflowPrizeForm } from './webflow-prize-form';

CollectionFormRouter.displayName = 'CollectionFormRouter';
