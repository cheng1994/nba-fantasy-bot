/**
 * Example usage of the Player Wishlist feature
 * 
 * This demonstrates how to:
 * - Add players to a wishlist
 * - Retrieve a user's wishlist
 * - Update priorities
 * - Remove from wishlist
 * - Check wishlist status
 * 
 * Run with: npx tsx scripts/example_wishlist_usage.ts
 */

import { 
    addToWishlist, 
    getWishlist, 
    updateWishlistPriority, 
    removeFromWishlist,
    isPlayerWishlisted,
    getWishlistPlayerIds
} from '../src/lib/actions/wishlist'

async function main() {
    console.log('🎯 Player Wishlist Feature Example\n')

    // Example user and season
    const userId = 'example_user_123'
    const season = 2025

    // 1. Add players to wishlist
    console.log('1️⃣ Adding players to wishlist...')
    
    const player1 = await addToWishlist({
        owner: userId,
        playerId: 'curryst01', // Stephen Curry
        season,
        priority: 1, // Highest priority
        notes: 'Elite three-point shooter, fits my punt FG% strategy'
    })
    console.log('   ✅ Added:', player1.success ? 'Stephen Curry (Priority 1)' : player1.error)

    const player2 = await addToWishlist({
        owner: userId,
        playerId: 'jamesle01', // LeBron James
        season,
        priority: 2,
        notes: 'All-around contributor, high assists for forward'
    })
    console.log('   ✅ Added:', player2.success ? 'LeBron James (Priority 2)' : player2.error)

    const player3 = await addToWishlist({
        owner: userId,
        playerId: 'duranke01', // Kevin Durant
        season,
        priority: 1,
        notes: 'Elite scorer, efficient percentages'
    })
    console.log('   ✅ Added:', player3.success ? 'Kevin Durant (Priority 1)' : player3.error)

    // 2. Get full wishlist with player details
    console.log('\n2️⃣ Retrieving full wishlist...')
    const wishlist = await getWishlist({ owner: userId, season })
    
    if (wishlist.success && wishlist.data.length > 0) {
        console.log(`   Found ${wishlist.data.length} players on wishlist:\n`)
        wishlist.data.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.playerName} (${item.position} - ${item.team})`)
            console.log(`      Priority: ${item.priority} | Projected FPTS: ${item.projectedFpts}`)
            console.log(`      Notes: ${item.notes || 'None'}`)
            console.log(`      Drafted: ${item.drafted ? 'Yes' : 'No'}`)
            console.log('')
        })
    } else {
        console.log('   No players on wishlist')
    }

    // 3. Get just player IDs (quick lookup for rankings)
    console.log('3️⃣ Getting wishlist player IDs for quick lookup...')
    const playerIds = await getWishlistPlayerIds(userId, season)
    
    if (playerIds.success) {
        console.log('   Player IDs and priorities:')
        playerIds.data.forEach(item => {
            console.log(`   - ${item.playerId}: Priority ${item.priority}`)
        })
    }

    // 4. Check if specific player is wishlisted
    console.log('\n4️⃣ Checking if Stephen Curry is wishlisted...')
    const curryStatus = await isPlayerWishlisted(userId, 'curryst01', season)
    
    if (curryStatus.success) {
        console.log(`   Is wishlisted: ${curryStatus.isWishlisted}`)
        if (curryStatus.isWishlisted) {
            console.log(`   Priority: ${curryStatus.priority}`)
        }
    }

    // 5. Update wishlist priority
    console.log('\n5️⃣ Updating LeBron James priority from 2 to 3...')
    if (player2.success && player2.data) {
        const updated = await updateWishlistPriority({
            id: player2.data.id,
            priority: 3,
            notes: 'Lowering priority due to age concerns'
        })
        console.log('   ✅ Updated:', updated.success ? 'Priority changed to 3' : updated.error)
    }

    // 6. Remove from wishlist
    console.log('\n6️⃣ Removing Kevin Durant from wishlist...')
    if (player3.success && player3.data) {
        const removed = await removeFromWishlist({
            id: player3.data.id
        })
        console.log('   ✅ Removed:', removed.success ? 'Kevin Durant removed' : removed.error)
    }

    // 7. Show final wishlist
    console.log('\n7️⃣ Final wishlist after changes:')
    const finalWishlist = await getWishlist({ owner: userId, season })
    
    if (finalWishlist.success) {
        console.log(`   Total players: ${finalWishlist.data.length}`)
        finalWishlist.data.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.playerName} - Priority ${item.priority}`)
        })
    }

    console.log('\n✅ Example completed!')
    console.log('\n💡 AI Chat Integration:')
    console.log('   When you ask the AI assistant for draft recommendations,')
    console.log('   it will automatically check your wishlist and boost rankings')
    console.log('   for wishlisted players based on their priority levels.')
    console.log('')
    console.log('   Priority 1 players get ~15-20 spot boost')
    console.log('   Priority 2-3 players get ~10-15 spot boost')
    console.log('   Priority 4-6 players get ~5-10 spot boost')
    console.log('   Priority 7-10 players get ~3-5 spot boost')
}

main().catch(console.error)

