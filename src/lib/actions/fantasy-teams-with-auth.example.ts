/**
 * Example: Using Fantasy Teams with Stack Auth
 * 
 * This file shows how to integrate Stack Auth user IDs with the fantasy teams system.
 * The owner field in fantasy_teams stores the Stack Auth user.id (TEXT type).
 * 
 * No foreign key constraint is used per auth best practices, since user management
 * happens externally through Stack Auth.
 */

import { stackServerApp } from '@/stack/server';
import { 
    createFantasyTeam, 
    getFantasyTeamsByOwner,
    getFantasyTeam 
} from './fantasy-teams';

/**
 * Example: Create a fantasy team for the currently logged-in user
 * Use in Server Components or Server Actions
 */
export async function createTeamForCurrentUser(teamName: string, season: number) {
    // Get the authenticated user
    const user = await stackServerApp.getUser({ or: "redirect" });
    
    // Create the team with the user's ID
    const team = await createFantasyTeam({
        name: teamName,
        owner: user.id, // Stack Auth user ID
        season: season,
    });
    
    return team;
}

/**
 * Example: Get all teams for the currently logged-in user
 * Use in Server Components
 */
export async function getCurrentUserTeams(season?: number) {
    const user = await stackServerApp.getUser({ or: "redirect" });
    
    const teams = await getFantasyTeamsByOwner(user.id, season);
    
    return teams;
}

/**
 * Example: Verify team ownership before allowing modifications
 * Use this pattern in Server Actions to ensure users can only modify their own teams
 */
export async function verifyTeamOwnership(teamId: number) {
    const user = await stackServerApp.getUser({ or: "redirect" });
    const team = await getFantasyTeam(teamId);
    
    if (!team) {
        throw new Error('Team not found');
    }
    
    if (team.owner !== user.id) {
        throw new Error('Unauthorized: You do not own this team');
    }
    
    return { user, team };
}

/**
 * Example: Get team with user information
 * Shows how to fetch team data along with owner details
 */
export async function getTeamWithOwnerInfo(teamId: number) {
    const team = await getFantasyTeam(teamId);
    
    if (!team) {
        return null;
    }
    
    // Fetch the owner's Stack Auth user information
    const owner = await stackServerApp.getUser(team.owner);
    
    return {
        ...team,
        ownerInfo: owner ? {
            id: owner.id,
            displayName: owner.displayName,
            primaryEmail: owner.primaryEmail,
            profileImageUrl: owner.profileImageUrl,
        } : null,
    };
}

/**
 * Example: List all teams with owner information (admin view)
 * Useful for admin dashboards or leaderboards
 */
export async function getAllTeamsWithOwners(season: number) {
    // This would require a custom query to get all teams for a season
    // Then fetch user info for each unique owner
    // Implementation left as an exercise based on your specific needs
}

