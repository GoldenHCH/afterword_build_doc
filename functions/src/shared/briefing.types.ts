import { briefingStatuses } from './briefing.constants';

export type BriefingStatus = (typeof briefingStatuses)[keyof typeof briefingStatuses];
