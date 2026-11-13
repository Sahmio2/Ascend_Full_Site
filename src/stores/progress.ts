'use client';
import { create } from 'zustand';
import type { ProgressResponse,ProgressRecord } from '../contracts/progress';
// Store UI selection only. Private records stay in component/request scope, not persisted browser storage.
interface ProgressState {metric:ProgressRecord['metric'];period:ProgressResponse['period'];setMetric:(metric:ProgressRecord['metric'])=>void;setPeriod:(period:ProgressResponse['period'])=>void}
export const useProgressStore=create<ProgressState>(set=>({metric:'BODYWEIGHT_KG',period:'12w',setMetric:metric=>set({metric}),setPeriod:period=>set({period})}));
