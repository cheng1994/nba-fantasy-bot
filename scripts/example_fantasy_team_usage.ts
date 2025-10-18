/**
 * Example usage of Fantasy Teams feature
 * 
 * This file demonstrates how to create and manage fantasy basketball teams.
 * Run with: tsx scripts/example_fantasy_team_usage.ts
 */

import {
  createFantasyTeam,
  addPlayerToRoster,
  getFantasyTeam,
  getFantasyTeamsByOwner,
  validateRosterPositions,
  getAvailablePlayers,
  updateRosterSpot,
  removePlayerFromRoster,
  deleteFantasyTeam,
} from '../src/lib/actions/fantasy-teams';

async function exampleUsage() {
  console.log('🏀 Fantasy Teams Example Usage\n');

  try {
    // 1. Create a new fantasy team
    console.log('1️⃣  Creating a new fantasy team...');
    const team = await createFantasyTeam({
      name: 'Championship Squad',
      owner: 'user123',
      season: 2024,
    });
    console.log(`   ✅ Created team: ${team.name} (ID: ${team.id})\n`);

    // 2. Add players to fill required positions
    console.log('2️⃣  Adding players to roster...');
    
    const players = [
      { playerId: 'curryst01', position: 'PG', eligible: 'PG,SG', name: 'Stephen Curry' },
      { playerId: 'hardeja01', position: 'SG', eligible: 'SG,SF', name: 'James Harden' },
      { playerId: 'jamesle01', position: 'SF', eligible: 'SF,PF', name: 'LeBron James' },
      { playerId: 'davisan02', position: 'PF', eligible: 'PF,C', name: 'Anthony Davis' },
      { playerId: 'embiijo01', position: 'C', eligible: 'C', name: 'Joel Embiid' },
      { playerId: 'lillada01', position: 'G', eligible: 'PG,SG', name: 'Damian Lillard' },
      { playerId: 'duranke01', position: 'F', eligible: 'SF,PF', name: 'Kevin Durant' },
      { playerId: 'antetgi01', position: 'UTIL', eligible: 'SF,PF', name: 'Giannis Antetokounmpo' },
      { playerId: 'jokicni01', position: 'UTIL', eligible: 'C', name: 'Nikola Jokic' },
      { playerId: 'doncilu01', position: 'BENCH', eligible: 'PG,SG', name: 'Luka Doncic' },
      { playerId: 'tatumja01', position: 'BENCH', eligible: 'SF,PF', name: 'Jayson Tatum' },
      { playerId: 'bookede01', position: 'BENCH', eligible: 'SG,SF', name: 'Devin Booker' },
      { playerId: 'youngtr01', position: 'BENCH', eligible: 'PG', name: 'Trae Young' },
    ];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      try {
        await addPlayerToRoster({
          teamId: team.id,
          playerId: player.playerId,
          designatedPosition: player.position as any,
          eligiblePositions: player.eligible,
          rosterOrder: i,
        });
        console.log(`   ✅ Added ${player.name} (${player.position}) - Eligible: ${player.eligible}`);
      } catch (error) {
        console.log(`   ⚠️  Couldn't add ${player.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    console.log('');

    // 3. Get the complete team with roster
    console.log('3️⃣  Fetching complete team details...');
    const fullTeam = await getFantasyTeam(team.id);
    if (fullTeam) {
      console.log(`   Team: ${fullTeam.name}`);
      console.log(`   Owner: ${fullTeam.owner}`);
      console.log(`   Season: ${fullTeam.season}`);
      console.log(`   Roster Size: ${fullTeam.roster.length}/13 players`);
      console.log('');
      
      console.log('   📋 Roster:');
      fullTeam.roster.forEach(spot => {
        const pts = spot.fptsTotal ? parseFloat(spot.fptsTotal.toString()).toFixed(1) : 'N/A';
        console.log(`      ${spot.designatedPosition.padEnd(6)} - ${spot.playerName || 'Unknown Player'} (${spot.eligiblePositions}) - ${pts} FPTS`);
      });
      console.log('');
    }

    // 4. Validate roster positions
    console.log('4️⃣  Validating roster positions...');
    const validation = await validateRosterPositions(team.id);
    console.log(`   Valid Roster: ${validation.isValid ? '✅' : '❌'}`);
    console.log(`   Roster Count: ${validation.rosterCount}/13`);
    console.log(`   Full Roster: ${validation.hasFullRoster ? '✅' : '❌'}`);
    if (validation.missingPositions.length > 0) {
      console.log(`   Missing Positions: ${validation.missingPositions.join(', ')}`);
    }
    console.log('');

    // 5. Get all teams for owner
    console.log('5️⃣  Getting all teams for owner...');
    const ownerTeams = await getFantasyTeamsByOwner('user123', 2024);
    console.log(`   Owner has ${ownerTeams.length} team(s) for 2024 season`);
    ownerTeams.forEach(t => {
      console.log(`      - ${t.name} (ID: ${t.id})`);
    });
    console.log('');

    // 6. Get available players
    console.log('6️⃣  Getting available players (not on this team)...');
    const available = await getAvailablePlayers(team.id, 2024, 10);
    console.log(`   Found ${available.length} available players (showing top 10):`);
    available.slice(0, 5).forEach(p => {
      const pts = p.fptsTotal ? parseFloat(p.fptsTotal.toString()).toFixed(1) : 'N/A';
      console.log(`      - ${p.player} (${p.position}) - ${pts} FPTS`);
    });
    console.log('');

    // 7. Update a roster spot
    console.log('7️⃣  Updating roster spot (moving player to different position)...');
    if (fullTeam && fullTeam.roster.length > 0) {
      const firstSpot = fullTeam.roster[0];
      await updateRosterSpot({
        id: firstSpot.id,
        rosterOrder: 99, // Move to end
      });
      console.log(`   ✅ Updated roster spot for ${firstSpot.playerName}`);
      console.log('');
    }

    // 8. Remove a player (example - commented out to keep team intact)
    console.log('8️⃣  Remove player example (commented out):');
    console.log('   // await removePlayerFromRoster(rosterSpotId);');
    console.log('');

    // 9. Delete team (example - commented out)
    console.log('9️⃣  Delete team example (commented out):');
    console.log('   // await deleteFantasyTeam(team.id);');
    console.log('');

    console.log('✨ Example completed successfully!\n');
    console.log('📚 For more information, see: src/lib/actions/README_FANTASY_TEAMS.md');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  exampleUsage()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error);
      process.exit(1);
    });
}

export { exampleUsage };

