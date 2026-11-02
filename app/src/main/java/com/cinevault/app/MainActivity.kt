package com.cinevault.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.app.Activity
import android.view.View
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.geometry.Offset
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import org.json.JSONArray
import org.json.JSONObject

private val bg = Color(0xFF080A10)
private val panel = Color(0xFF151A27)
private val muted = Color(0xFF9BA4B8)
private val pink = Color(0xFFFF4D6D)
private val mint = Color(0xFF69E0C0)

private fun setImmersive(activity: Activity, enabled: Boolean) {
    WindowCompat.setDecorFitsSystemWindows(activity.window, !enabled)
    val controller = WindowInsetsControllerCompat(activity.window, activity.window.decorView)
    if (enabled) {
        controller.hide(WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars())
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    } else {
        controller.show(WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars())
    }
}
private data class Film(val uri: String, val title: String, val favorite: Boolean = false, val position: Long = 0L)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(8, 10, 16)
        window.navigationBarColor = android.graphics.Color.rgb(8, 10, 16)
        setContent { VaultApp() }
    }
}

@Composable
private fun VaultApp() {
    val context = LocalContext.current
    val activity = context as? Activity
    val prefs = remember { context.getSharedPreferences("vault", Context.MODE_PRIVATE) }
    var films by remember { mutableStateOf(readFilms(prefs)) }
    var tab by remember { mutableStateOf("Home") }
    var search by remember { mutableStateOf("") }
    var active by remember { mutableStateOf<Film?>(null) }
    var speed by remember { mutableFloatStateOf(1f) }
    var speedMenu by remember { mutableStateOf(false) }
    var player by remember { mutableStateOf<ExoPlayer?>(null) }

    fun save(list: List<Film>) {
        films = list
        val a = JSONArray()
        list.forEach { a.put(JSONObject().put("uri", it.uri).put("title", it.title).put("favorite", it.favorite).put("position", it.position)) }
        prefs.edit().putString("films", a.toString()).apply()
    }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        if (uris.isNotEmpty()) {
            val next = uris.map { u ->
                try { context.contentResolver.takePersistableUriPermission(u, Intent.FLAG_GRANT_READ_URI_PERMISSION) } catch (_: Exception) {}
                films.firstOrNull { it.uri == u.toString() } ?: Film(u.toString(), titleOf(context, u))
            }
            save((films + next).distinctBy { it.uri })
            tab = "Library"
        }
    }
    fun pick() = picker.launch(arrayOf("video/*"))
    fun play(f: Film) {
        player?.release()
        active = f
        activity?.let { setImmersive(it, true) }
        player = ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(Uri.parse(f.uri)))
            prepare()
            seekTo(f.position)
            playWhenReady = true
            setPlaybackSpeed(speed)
        }
    }
    fun closePlayer() {
        val p = player
        val f = active
        if (p != null && f != null) save(films.map { if (it.uri == f.uri) it.copy(position = p.currentPosition) else it })
        player?.release()
        player = null
        active = null
        activity?.let { setImmersive(it, false) }
    }

    MaterialTheme(colorScheme = darkColorScheme(background = bg, surface = panel, primary = pink, secondary = mint)) {
        Surface(Modifier.fillMaxSize(), color = bg) {
            if (active != null && player != null) {
                Box(Modifier.fillMaxSize().background(Color.Black)) {
                    AndroidView(factory = { c -> PlayerView(c).apply {
                        this.player = player
                        useController = true
                        resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                        setShowFastForwardButton(true)
                        setShowRewindButton(true)
                    } }, update = { it.player = player }, modifier = Modifier.fillMaxSize())
                    Box(
                        Modifier.fillMaxSize().pointerInput(player) {
                            detectTapGestures(
                                onDoubleTap = { point ->
                                    val p = player ?: return@detectTapGestures
                                    val jump = 10_000L
                                    if (point.x < size.width / 2f) p.seekTo((p.currentPosition - jump).coerceAtLeast(0L))
                                    else p.seekTo((p.currentPosition + jump).coerceAtMost(p.duration.takeIf { it > 0 } ?: Long.MAX_VALUE))
                                },
                                onLongPress = { player?.setPlaybackSpeed(2f) },
                                onPress = {
                                    try { awaitRelease() } finally { player?.setPlaybackSpeed(speed) }
                                }
                            )
                        }
                    )
                    Row(
                        Modifier.align(Alignment.TopStart).fillMaxWidth()
                            .background(Brush.verticalGradient(listOf(Color(0x99000000), Color.Transparent)))
                            .padding(horizontal = 8.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = ::closePlayer) { Icon(Icons.Default.ArrowBack, "Exit full screen", tint = Color.White) }
                        Text(active!!.title, Modifier.weight(1f), color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold)
                        Box {
                            TextButton(onClick = { speedMenu = true }) { Text(speed.toString() + "x", color = pink) }
                            DropdownMenu(expanded = speedMenu, onDismissRequest = { speedMenu = false }) {
                                listOf(0.5f, 0.75f, 1f, 1.25f, 1.5f, 2f).forEach { v ->
                                    DropdownMenuItem(text = { Text(v.toString() + "x") }, onClick = { speed = v; player?.setPlaybackSpeed(v); speedMenu = false })
                                }
                            }
                        }
                    }
                    Text(
                        "Double-tap left/right: −10s / +10s  •  Hold: 2×",
                        Modifier.align(Alignment.BottomCenter).padding(bottom = 20.dp)
                            .clip(RoundedCornerShape(14.dp)).background(Color(0x99000000)).padding(horizontal = 14.dp, vertical = 8.dp),
                        color = Color.White, fontSize = 11.sp
                    )
                }
            } else {
                Column(Modifier.fillMaxSize()) {
                    Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(42.dp).clip(RoundedCornerShape(14.dp)).background(Brush.linearGradient(listOf(pink, Color(0xFF805BFF)))), contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(30.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("CINEVAULT", fontSize = 20.sp, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
                            Text("YOUR MOVIES. YOUR WORLD.", fontSize = 9.sp, color = muted, letterSpacing = 1.4.sp)
                        }
                        IconButton(onClick = ::pick) { Icon(Icons.Default.Add, "Add movies", tint = pink) }
                    }
                    when (tab) {
                        "Settings" -> Column(Modifier.fillMaxSize().padding(22.dp)) {
                            Text("Private by default", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
                            Spacer(Modifier.height(12.dp))
                            Text("No account, ads, servers, or video uploads. Your library and playback progress are stored locally.", color = muted)
                            Spacer(Modifier.height(18.dp))
                            Text("Videos in your library: " + films.size, color = mint)
                            Spacer(Modifier.height(18.dp))
                            Button(onClick = ::pick, colors = ButtonDefaults.buttonColors(containerColor = pink)) { Text("Add videos") }
                        }
                        else -> {
                            if (tab == "Home") {
                                Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(RoundedCornerShape(26.dp))
                                    .background(Brush.linearGradient(listOf(Color(0xFF302449), Color(0xFF151A27)))).padding(22.dp)) {
                                    Text("YOUR OFFLINE CINEMA", color = mint, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                                    Spacer(Modifier.height(12.dp))
                                    Text("The journey\nis the movie.", fontSize = 32.sp, lineHeight = 36.sp, fontWeight = FontWeight.ExtraBold)
                                    Spacer(Modifier.height(8.dp))
                                    Text("No signal. No problem. Just press play.", color = muted, fontSize = 13.sp)
                                    Spacer(Modifier.height(14.dp))
                                    Button(onClick = ::pick, colors = ButtonDefaults.buttonColors(containerColor = pink)) { Icon(Icons.Default.VideoLibrary, null); Spacer(Modifier.width(8.dp)); Text("Add movies") }
                                }
                            } else {
                                OutlinedTextField(value = search, onValueChange = { search = it }, modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                                    placeholder = { Text("Search your movies") }, leadingIcon = { Icon(Icons.Default.Search, null) }, singleLine = true)
                            }
                            val visible = films.filter { (tab != "Favorites" || it.favorite) && (tab != "Library" || it.title.contains(search, true)) }
                            LazyColumn(Modifier.weight(1f).padding(top = 12.dp), contentPadding = PaddingValues(bottom = 12.dp)) {
                                if (visible.isEmpty()) item {
                                    Column(Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Icon(Icons.Default.VideoLibrary, null, tint = pink, modifier = Modifier.size(44.dp))
                                        Spacer(Modifier.height(12.dp))
                                        Text("Your vault is waiting", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                        Text("Add videos stored on your phone. Internet is not needed to play them.", color = muted, fontSize = 12.sp)
                                        Spacer(Modifier.height(12.dp))
                                        Button(onClick = ::pick, colors = ButtonDefaults.buttonColors(containerColor = pink)) { Text("Choose videos") }
                                    }
                                }
                                items(visible, key = { it.uri }) { film ->
                                    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp).clip(RoundedCornerShape(18.dp))
                                        .background(panel).clickable { play(film) }.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Box(Modifier.size(width = 66.dp, height = 78.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF252D42)), contentAlignment = Alignment.Center) {
                                            Icon(Icons.Default.Movie, null, tint = Color(0xFFB5C0DE), modifier = Modifier.size(30.dp))
                                        }
                                        Spacer(Modifier.width(12.dp))
                                        Column(Modifier.weight(1f)) {
                                            Text(film.title, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                            Spacer(Modifier.height(6.dp))
                                            Text(if (film.position > 0) "Continue watching" else "Ready to watch", color = muted, fontSize = 11.sp)
                                            Spacer(Modifier.height(8.dp))
                                            Text("▶  Play offline", color = mint, fontSize = 11.sp)
                                        }
                                        IconButton(onClick = { save(films.map { if (it.uri == film.uri) it.copy(favorite = !it.favorite) else it }) }) {
                                            Icon(if (film.favorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder, "Favorite", tint = if (film.favorite) pink else muted)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    NavigationBar(containerColor = Color(0xFF10131C)) {
                        listOf(Triple("Home", Icons.Default.Home, "Home"), Triple("Library", Icons.Default.VideoLibrary, "Library"),
                            Triple("Favorites", Icons.Default.FavoriteBorder, "Favorites"), Triple("Settings", Icons.Default.Settings, "Settings")).forEach { (label, icon, route) ->
                            NavigationBarItem(selected = tab == route, onClick = { tab = route }, icon = { Icon(icon, label) }, label = { Text(label, fontSize = 10.sp) })
                        }
                    }
                }
            }
        }
    }
}

private fun readFilms(p: android.content.SharedPreferences): List<Film> = try {
    val a = JSONArray(p.getString("films", "[]"))
    (0 until a.length()).map { i -> a.getJSONObject(i).let { Film(it.getString("uri"), it.optString("title", "Untitled video"), it.optBoolean("favorite"), it.optLong("position")) } }
} catch (_: Exception) { emptyList() }

private fun titleOf(c: Context, u: Uri): String {
    val name = try {
        c.contentResolver.query(u, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use { if (it.moveToFirst()) it.getString(0) else null }
    } catch (_: Exception) { null }
    return name?.substringBeforeLast('.', name)?.replace('_', ' ') ?: "Untitled video"
}
