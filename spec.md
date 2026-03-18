# Campus Escape → GTA City

## Current State
A 2D top-down campus stealth game (Campus Escape) with guards, vision cones, and a leaderboard. Single fixed-screen map, no driving, no weapons.

## Requested Changes (Diff)

### Add
- **GTA-style open world city**: Large scrolling city map (3000x3000) with a grid of streets, city blocks, buildings, sidewalks, parks, water
- **Drivable cars**: ~15 parked cars scattered around. Player walks up and presses E to enter/exit. While in car: car physics (acceleration, friction, turning radius). Can ram other cars. Cars have color and body shape.
- **On-foot player**: WASD movement, can sprint (Shift). Collides with buildings and parked cars.
- **Police wanted system**: 0-5 stars. Punch/shoot NPCs or steal cars = +1 star. Police cruisers spawn and chase player when wanted. Losing sight for 5s drops stars.
- **Weapons**: Pistol pickup on map. Press F to shoot. Bullet travels in aim direction (mouse). Can shoot police and NPCs.
- **NPC pedestrians**: ~20 NPCs wandering randomly. They run away when shot at.
- **Police cars**: Spawn at 1+ star. Chase player using simple pathfinding along the grid streets. Ram into player.
- **Mini-map**: Bottom-right HUD. Shows player position, nearby police, cars, NPCs on small map.
- **Camera**: Follows player, world scrolls. Camera smoothly lerps to player.
- **HUD**: Wanted stars top-left, health bar, current weapon, mini-map.
- **Ammo and health pickups** scattered on map.
- **Game over**: Health reaches 0 = busted screen, respawn.

### Modify
- Replace GameCanvas.tsx entirely with new GTAGame.tsx
- Replace LandingPage.tsx with GTA-themed landing
- App.tsx updated to use new screens
- Keep backend leaderboard integration (submit score = survival time + stars achieved)

### Remove
- Old campus escape guard/vision cone system
- Old campus map layout

## Implementation Plan
1. Define world constants: map size 3000x3000, tile size 40px
2. Generate city grid procedurally: city blocks, roads, sidewalks, parks
3. Implement camera/viewport system with smooth follow
4. Player on-foot: WASD + sprint + collision vs buildings
5. Car system: enter/exit (E key), car physics (accel/brake/steer), multiple car colors
6. NPC system: random walk AI, flee behavior
7. Police system: wanted stars, police car spawning, chase AI
8. Weapon system: pistol pickup, shoot with mouse aim, bullet collision
9. Health/ammo pickups
10. HUD: stars, health bar, ammo count, mini-map canvas
11. Game over / respawn flow
12. Landing page GTA-themed redesign
