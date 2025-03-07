<?php
/*
    * API für Highscores
    * GET: Liefert die Highscores als JSON
    * POST: Speichert einen neuen Highscore
*/
header('Access-Control-Allow-Origin: *'); // Erlaubt Zugriff von allen Domains
header('Content-Type: application/json'); // Antwort ist JSON
header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); // Erlaubt GET, POST und OPTIONS Requests 
header('Access-Control-Allow-Headers: Content-Type'); // Erlaubt Content-Type Header --> wichtig um JSON zu senden

$file = $_SERVER['DOCUMENT_ROOT'] . '/game/highscores.txt'; // Pfad zur Datei, in der die Highscores gespeichert werden

/**
 * Validiert und bereinigt die eingegebenen Spielerdaten
 * 
 * @param array $data Rohdaten aus dem Request
 * @return array Bereinigte und validierte Daten
 */
function validateInput($data) {
    return [
        'name' => substr(htmlspecialchars(trim($data['name'] ?? 'Anonymous')), 0, 20), // Name auf 20 Zeichen kürzen, HTML-Tags entfernen und trimmen
        'score' => max(0, (int)($data['score'] ?? 0)), // Score als Integer, mindestens 0
        'accuracy' => max(0, min(100, (int)($data['accuracy'] ?? 0))), // Accuracy als Integer, Begrenzung: 0-100
        'timestamp' => date('Y-m-d H:i:s') // Aktuellen Zeitstempel setzen
    ];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') { // GET Request: Highscores auslesen und zurückgeben
        if (!file_exists($file)) file_put_contents($file, '[]'); // Datei anlegen, falls sie nicht existiert (wenn keine Highscores vorhanden)
        $content = file_get_contents($file); // Inhalt der Datei lesen
        if (empty($content)) $content = '[]'; // Wenn Datei leer ist, leeres Array zurückgeben
        echo $content; // Inhalt der Datei als JSON zurückgeben
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') { // POST Request: Neuen Highscore speichern
        $input = json_decode(file_get_contents('php://input'), true); // JSON-Daten aus dem Request lesen
        if (json_last_error() !== JSON_ERROR_NONE) throw new Exception('Invalid JSON'); // Fehler, wenn JSON ungültig
        
        $entry = validateInput($input); // Eingegebene Daten validieren
        if (!file_exists($file)) file_put_contents($file, '[]'); // Datei anlegen, falls sie nicht existiert
        
        $content = file_get_contents($file); // Inhalt der Datei lesen
        $scores = json_decode($content, true) ?: []; // JSON in Array umwandeln (leeres Array falls fehlerhaft)
        $scores[] = $entry; // Neuen Eintrag hinzufügen

        // Highscores sortieren: primär nach Score (absteigend), sekundär nach Genauigkeit (absteigend) und auf 100 Einträge begrenzen
        usort($scores, fn($a, $b) => ($b['score'] <=> $a['score']) ?: ($b['accuracy'] <=> $a['accuracy']));
        $scores = array_slice($scores, 0, 100);
        
        // Highscores zurück in Datei schreiben (mit LOCK_EX: Datei exklusiv sperren)
        if (!file_put_contents($file, json_encode($scores), LOCK_EX)) {
            throw new Exception('Could not save highscores');
        }

        // Erfolgreiche Antwort senden
        echo json_encode(['success' => true]);
    }
} catch (Exception $e) {
    http_response_code(500); // HTTP-Statuscode 500: Serverfehler
    // Fehlermeldung und Dateipfad zurückgeben als JSON (für Debugging)
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => realpath($file)
    ]);
}
?>