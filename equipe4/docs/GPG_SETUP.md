# Configuration GPG pour les Commits Signés

## Installation de GPG sur Windows

### Option 1: Chocolatey
```powershell
choco install gpg4win
```

### Option 2: Téléchargement direct
1. Télécharger GPG4Win depuis https://gpg4win.org/
2. Installer le package complet

## Configuration GPG

### 1. Générer une nouvelle clé GPG
```bash
gpg --full-generate-key
```

Choisir :
- Type de clé : RSA and RSA (default)
- Taille : 4096 bits
- Expiration : 0 (n'expire jamais) ou 1y (1 an)
- Nom réel : Votre nom complet
- Email : Votre email Git (Divjob23@gmail.com)

### 2. Lister les clés
```bash
gpg --list-secret-keys --keyid-format LONG
```

### 3. Exporter la clé publique
```bash
gpg --armor --export YOUR_KEY_ID
```

### 4. Configurer Git
```bash
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true
git config --global gpg.program gpg
```

### 5. Ajouter la clé publique à GitHub
1. Aller dans Settings > SSH and GPG keys
2. Cliquer "New GPG key"
3. Coller la clé publique exportée

## Test
```bash
git commit -S -m "Test commit signé"
```

## Dépannage

### Erreur "gpg failed to sign the data"
```bash
export GPG_TTY=$(tty)
```

### Sur Windows avec Git Bash
```bash
git config --global gpg.program "C:/Program Files (x86)/GnuPG/bin/gpg.exe"
```
