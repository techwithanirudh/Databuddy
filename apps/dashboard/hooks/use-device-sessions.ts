'use client';

import { authClient } from '@databuddy/auth/client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DeviceSessionDetails {
	sessionToken: string;
	userId: string;
	provider: string;
	isCurrent: boolean;
	ipAddress: string | null;
	userAgent: string | null;
	lastActive: string;
	createdAt: string;
	expiresAt: string;
}

export interface DeviceSessionEntry {
	session: DeviceSessionDetails;
	user?: {
		email?: string;
		name?: string;
	};
	sessionToken: string;
	isCurrent: boolean;
	provider: string;
	userId: string;
}

export function useDeviceSessions() {
	const [sessions, setSessions] = useState<DeviceSessionEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [operatingSession, setOperatingSession] = useState<string | null>(null);

	const fetchSessions = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await authClient.multiSession.listDeviceSessions();
			if (result.error) {
				throw new Error(result.error.message);
			}
			const processedSessions: DeviceSessionEntry[] =
				result.data?.map((item: any) => ({
					session: item.session || {
						sessionToken: item.sessionToken,
						userId: item.userId,
						provider: item.provider,
						isCurrent: item.isCurrent,
						ipAddress: item.ipAddress,
						userAgent: item.userAgent,
						lastActive: item.lastActive,
						createdAt: item.createdAt,
						expiresAt: item.expiresAt,
					},
					user: item.user || {
						email: item.email || 'Unknown User',
						name: item.name,
					},
					sessionToken: item.sessionToken || item.session?.sessionToken,
					isCurrent:
						typeof item.isCurrent === 'boolean'
							? item.isCurrent
							: item.session?.isCurrent,
					provider: item.provider || item.session?.provider || 'N/A',
					userId: item.userId || item.session?.userId,
				})) || [];
			setSessions(processedSessions);
		} catch (err: any) {
			const errorMessage = err.message || 'Failed to fetch sessions.';
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSessions();
	}, [fetchSessions]);

	const setActiveSession = async (sessionToken: string) => {
		setOperatingSession(sessionToken);
		try {
			const result = await authClient.multiSession.setActive({ sessionToken });
			if (result.error) {
				throw new Error(result.error.message);
			}
			toast.success('Session switched successfully. Reloading...');
			window.location.reload();
			return { success: true };
		} catch (err: any) {
			toast.error(err.message || 'Failed to switch session.');
			return {
				success: false,
				error: err.message || 'Failed to switch session.',
			};
		} finally {
			setOperatingSession(null);
		}
	};

	const revokeSession = async (sessionToken: string) => {
		setOperatingSession(sessionToken);
		try {
			const result = await authClient.multiSession.revoke({ sessionToken });
			if (result.error) {
				throw new Error(result.error.message);
			}
			toast.success('Session revoked successfully.');
			fetchSessions();
			return { success: true };
		} catch (err: any) {
			toast.error(err.message || 'Failed to revoke session.');
			return {
				success: false,
				error: err.message || 'Failed to revoke session.',
			};
		} finally {
			setOperatingSession(null);
		}
	};

	return {
		sessions,
		isLoading,
		error,
		operatingSession,
		fetchSessions,
		setActiveSession,
		revokeSession,
	};
}
