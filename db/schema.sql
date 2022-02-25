DROP TABLE IF EXISTS songs;
CREATE TABLE songs (id INTEGER PRIMARY KEY AUTOINCREMENT, number INTEGER, title TEXT, lyrics TEXT);

DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, 
    type TEXT, 
    request_title TEXT, 
    correction_song INTEGER, 
    feedback_content TEXT);

INSERT INTO songs (number, title, lyrics) VALUES (1, 'Helan går', 'Helan går!\nSjunghoppfaderallanlallanlej!\nHelan går!\nSjunghoppfaderallanlei!\nOch den som inte Helan tar,\nhan ej eller Halvan får.\nHelan går!\nSjunghoppfaderallanlej!\nHEJ!');
INSERT INTO songs (number, title, lyrics) VALUES (2, 'Henkilökunta', ':,: Henkilökuntaa, henkilökuntaa,\nparlevuu :,:\nHenkilökuntaa, henkilökuntaa,\nhenkilökuntaa, henkilökuntaa.\n:,: Henkilökuntaa parlevuu :,:\n\nLissää viinaa, lissää viinaa, parlevuu...\nKonjakki ois poikaa...\nKaljakin kelpaa...\nKuka sen maksaa...');
