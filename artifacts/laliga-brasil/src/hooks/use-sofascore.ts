import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function teamImageUrl(teamId: number | string | undefined): string {
  if (!teamId) return "";
  return `${BASE}/api/sofascore/team-image/${teamId}`;
}

export function playerImageUrl(playerId: number | string | undefined): string {
  if (!playerId) return "";
  return `${BASE}/api/sofascore/player-image/${playerId}`;
}

export function tournamentImageUrl(tournamentId: number | string | undefined): string {
  if (!tournamentId) return "";
  return `${BASE}/api/sofascore/tournament-image/${tournamentId}`;
}

export async function sofascoreSearch(q: string) {
  const res = await fetch(`${BASE}/api/sofascore/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Erro na busca");
  return res.json();
}

export async function sofascoreTournamentSeasons(id: number | string) {
  const res = await fetch(`${BASE}/api/sofascore/tournament/${id}/seasons`);
  if (!res.ok) throw new Error("Erro ao buscar temporadas");
  return res.json();
}

export function useSofascoreEvent(id: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "event", id],
    queryFn: () => apiFetch<any>(`/api/sofascore/event/${id}`),
    enabled: !!id,
    refetchInterval: (data: any) => {
      const status = data?.state?.event?.status?.type;
      return status === "inprogress" ? 30_000 : false;
    },
  });
}

export function useSofascoreIncidents(id: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "incidents", id],
    queryFn: () => apiFetch<any>(`/api/sofascore/event/${id}/incidents`),
    enabled: !!id,
    refetchInterval: (data: any) => 30_000,
  });
}

export function useSofascoreStatistics(id: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "statistics", id],
    queryFn: () => apiFetch<any>(`/api/sofascore/event/${id}/statistics`),
    enabled: !!id,
    refetchInterval: 60_000,
  });
}

export function useSofascoreLineups(id: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "lineups", id],
    queryFn: () => apiFetch<any>(`/api/sofascore/event/${id}/lineups`),
    enabled: !!id,
  });
}

export function useSofascoreH2H(id: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "h2h", id],
    queryFn: () => apiFetch<any>(`/api/sofascore/event/${id}/h2h`),
    enabled: !!id,
  });
}

export function useSofascoreTeam(id: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "team", id],
    queryFn: () => apiFetch<any>(`/api/sofascore/team/${id}`),
    enabled: !!id,
  });
}

export function useSofascoreTeamLastEvents(id: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "team", id, "last"],
    queryFn: () => apiFetch<any>(`/api/sofascore/team/${id}/events/last/0`),
    enabled: !!id,
  });
}

export function useSofascoreTeamNextEvents(id: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "team", id, "next"],
    queryFn: () => apiFetch<any>(`/api/sofascore/team/${id}/events/next/0`),
    enabled: !!id,
  });
}

export function useSofascoreLaLigaSeasons() {
  return useQuery({
    queryKey: ["sofascore", "laliga", "seasons"],
    queryFn: () => apiFetch<any>(`/api/sofascore/tournament/8/seasons`),
    staleTime: 60 * 60 * 1000,
  });
}

export function useSofascoreLaLigaLastEvents(seasonId: number | undefined) {
  return useQuery({
    queryKey: ["sofascore", "laliga", "last", seasonId],
    queryFn: () => apiFetch<any>(`/api/sofascore/tournament/8/season/${seasonId}/events/last/0`),
    enabled: !!seasonId,
  });
}

export function useSofascoreLaLigaNextEvents(seasonId: number | undefined) {
  return useQuery({
    queryKey: ["sofascore", "laliga", "next", seasonId],
    queryFn: () => apiFetch<any>(`/api/sofascore/tournament/8/season/${seasonId}/events/next/0`),
    enabled: !!seasonId,
  });
}

export function useSofascoreTournamentSeasons(tournamentId: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "tournament", tournamentId, "seasons"],
    queryFn: () => apiFetch<any>(`/api/sofascore/tournament/${tournamentId}/seasons`),
    enabled: !!tournamentId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSofascoreTournamentLastEvents(tournamentId: number | string | undefined, seasonId: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "tournament", tournamentId, "season", seasonId, "last"],
    queryFn: () => apiFetch<any>(`/api/sofascore/tournament/${tournamentId}/season/${seasonId}/events/last/0`),
    enabled: !!tournamentId && !!seasonId,
  });
}

export function useSofascoreTournamentNextEvents(tournamentId: number | string | undefined, seasonId: number | string | undefined) {
  return useQuery({
    queryKey: ["sofascore", "tournament", tournamentId, "season", seasonId, "next"],
    queryFn: () => apiFetch<any>(`/api/sofascore/tournament/${tournamentId}/season/${seasonId}/events/next/0`),
    enabled: !!tournamentId && !!seasonId,
  });
}

export function useSofascoreTournamentRoundEvents(
  tournamentId: number | string | undefined,
  seasonId: number | string | undefined,
  round: number | undefined
) {
  return useQuery({
    queryKey: ["sofascore", "tournament", tournamentId, "season", seasonId, "round", round],
    queryFn: () => apiFetch<any>(`/api/sofascore/tournament/${tournamentId}/season/${seasonId}/events/round/${round}`),
    enabled: !!tournamentId && !!seasonId && round !== undefined,
  });
}
