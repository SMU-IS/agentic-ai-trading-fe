import { useState, useEffect, useCallback } from "react";

const METRICS_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/metrics`

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes, aligned with tracker refresh cadence

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PipelineMetrics {
  computed_at: string;
  window_hours: number;
  scraped: number;
  vectorised: number;
  signal_generated: number;
  order_placed: number;
  removed: {
    no_ticker: number;
    no_event: number;
  };
  avg_e2e_latency_s: number | null;
}

export interface ServiceMetricEntry {
  processed?: number;
  minds_processed?: number;
  ideas_processed?: number;
  avg_latency_s: number | null;
  time_to_stage_s?: number | null;
}

export interface ServiceMetrics {
  computed_at: string;
  window_hours: number;
  service_avg_latency: {
    "scraper:reddit": ServiceMetricEntry;
    "scraper:tradingview": ServiceMetricEntry;
    preproc: ServiceMetricEntry;
    ticker: ServiceMetricEntry;
    event: ServiceMetricEntry;
    sentiment: ServiceMetricEntry;
    vectorisation: ServiceMetricEntry;
    signal: ServiceMetricEntry;
    order: ServiceMetricEntry;
  };
}

// ─── Generic Fetch Hook ───────────────────────────────────────────────────────

interface UseMetricsResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useMetrics<T>(endpoint: string, pollInterval = POLL_INTERVAL_MS): UseMetricsResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json: T = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error fetching metrics");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, pollInterval);
    return () => clearInterval(intervalId);
  }, [fetchData, pollInterval]);

  return { data, loading, error, refetch: fetchData };
}

// ─── Pipeline Metrics Hook ────────────────────────────────────────────────────

/**
 * Fetches AgentFlow pipeline-level metrics (24hr window).
 * Covers: scraped → vectorised → signal → order counts,
 * removal reasons, and avg end-to-end latency.
 */
export function usePipelineMetrics(pollInterval = POLL_INTERVAL_MS) {
  return useMetrics<PipelineMetrics>(`${METRICS_BASE_URL}/pipeline`, pollInterval);
}

// ─── Service Metrics Hook ─────────────────────────────────────────────────────

/**
 * Fetches AgentFlow service-level metrics (1hr window).
 * Covers per-service processed counts, avg latency, and
 * time-to-stage latency across the full pipeline.
 */
export function useServiceMetrics(pollInterval = POLL_INTERVAL_MS) {
  return useMetrics<ServiceMetrics>(`${METRICS_BASE_URL}/service`, pollInterval);
}

// ─── Combined Hook ────────────────────────────────────────────────────────────

/**
 * Convenience hook to fetch both pipeline and service metrics together.
 * Useful for a unified Agent M metrics dashboard.
 */
export function useAgentMMetrics(pollInterval = POLL_INTERVAL_MS) {
  const pipeline = usePipelineMetrics(pollInterval);
  const services = useServiceMetrics(pollInterval);

  return {
    pipeline,
    services,
    loading: pipeline.loading || services.loading,
    error: pipeline.error ?? services.error,
    refetch: () => {
      pipeline.refetch();
      services.refetch();
    },
  };
}
