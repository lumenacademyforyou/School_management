import React from 'react';
import { FeatureTags } from '../../components/common/FeatureTags';
import { PageHeader } from '../../components/common/ui';
import { BankPanel } from './questionPapers/BankPanel';

/** Admin → Academics → Question Bank (QPG-001, QPG-002). Same bank the paper generator draws from. */
export const QuestionBankView: React.FC = () => (
  <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto pb-20">
    <PageHeader eyebrow="Academics · Examinations" icon="database" title="Question Bank" subtitle="Search, review and maintain the questions every paper is built from.">
      <FeatureTags ids={['QPG-001', 'QPG-002', 'QPG-014', 'QPG-017', 'QPG-018']} className="mt-2" />
    </PageHeader>
    <BankPanel />
  </div>
);
