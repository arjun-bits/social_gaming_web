#!/usr/bin/env bash
# copy_references.sh — copies reference images from AI session storage to docs/
set -e

MEDIA="/mnt/c/Users/arjun/.gemini/antigravity-ide/brain/164cafb8-7e35-40c4-a163-5e1d34a0f5e9/.tempmediaStorage"
DEST="/mnt/c/Users/arjun/Documents/house_party_games/social_gaming_web/docs/references/images"
mkdir -p "$DEST"

# ── AI-generated 3D board target reference images ─────────────────────────
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535390291.jpg" "$DEST/ref_01_3d_board_target_A.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535391093.jpg" "$DEST/ref_02_3d_board_target_B.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535392805.jpg" "$DEST/ref_03_3d_board_target_C.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535393494.jpg" "$DEST/ref_04_3d_board_target_D.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535394691.jpg" "$DEST/ref_05_3d_board_target_E.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535395499.jpg" "$DEST/ref_06_3d_board_target_F.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535396707.jpg" "$DEST/ref_07_3d_board_target_G.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535397507.jpg" "$DEST/ref_08_3d_board_target_H.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535397934.jpg" "$DEST/ref_09_3d_board_target_I.jpg"

# ── Building / city sprite references (used for CityMarker design) ─────────
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779535108725.jpg" "$DEST/ref_10_buildings_europe_mixed.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779533907129.jpg" "$DEST/ref_11_isometric_cityscape_overview.jpg"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779533003320.png" "$DEST/ref_12_buildings_western_alpine.png"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779533014244.png" "$DEST/ref_13_buildings_iberian_greek.png"

# ── UI screenshots — HostView lobby and game screens ──────────────────────
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779485220634.png" "$DEST/ui_01_host_game_lobby.png"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779485664779.png" "$DEST/ui_02_host_configure_game.png"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779531909439.png" "$DEST/ui_03_tv_secret_signals_lobby.png"

# ── Map/board progress screenshots ────────────────────────────────────────
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779536771924.png" "$DEST/progress_01_player_map_early.png"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779536772188.png" "$DEST/progress_02_player_map_routes.png"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779530278055.png" "$DEST/progress_03_host_board_isometric.png"
cp "$MEDIA/media_164cafb8-7e35-40c4-a163-5e1d34a0f5e9_1779533249966.png" "$DEST/progress_04_tv_ttre_view.png"

echo "Done. Images in $DEST:"
ls -lh "$DEST" | awk '{print $5, $9}'
