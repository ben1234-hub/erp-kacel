import os
import re
import unicodedata
import pandas as pd

# Dictionnaire de correspondance des wilayas algériennes (Codes de 01 à 58)
WILAYAS_ALGERIE = {
    "01": "Adrar", "02": "Chlef", "03": "Laghouat", "04": "Oum El Bouaghi",
    "05": "Batna", "06": "Béjaïa", "07": "Biskra", "08": "Béchar",
    "09": "Blida", "10": "Bouira", "11": "Tamanrasset", "12": "Tébessa",
    "13": "Tlemcen", "14": "Tiaret", "15": "Tizi Ouzou", "16": "Alger",
    "17": "Djelfa", "18": "Jijel", "19": "Sétif", "20": "Saïda",
    "21": "Skikda", "22": "Sidi Bel Abbès", "23": "Annaba", "24": "Guelma",
    "25": "Constantine", "26": "Médéa", "27": "Mostaganem", "28": "M'Sila",
    "29": "Mascara", "30": "Ouargla", "31": "Oran", "32": "El Bayadh",
    "33": "Illizi", "34": "Bordj Bou Arréridj", "35": "Boumerdès", "36": "El Tarf",
    "37": "Tindouf", "38": "Tissemsilt", "39": "El Oued", "40": "Khenchela",
    "41": "Souk Ahras", "42": "Tipaza", "43": "Mila", "44": "Aïn Defla",
    "45": "Naâma", "46": "Aïn Témouchent", "47": "Ghardaïa", "48": "Relizane",
    "49": "Timimoun", "50": "Bordj Badji Mokhtar", "51": "Ouled Djellal", "52": "Béni Abbès",
    "53": "In Salah", "54": "In Guezzam", "55": "Touggourt", "56": "Djanet",
    "57": "El M'Ghair", "58": "El Meniaa"
}

def normaliser_texte(texte):
    """Enlève les accents, met en minuscule et nettoie les espaces."""
    if not isinstance(texte, str):
        return ""
    texte_unicode = unicodedata.normalize('NFD', texte)
    sans_accents = "".join([c for c in texte_unicode if unicodedata.category(c) != 'Mn'])
    return sans_accents.lower().strip()

def detecter_wilaya(valeur):
    """
    Analyse une chaîne brute pour identifier le code de la wilaya algérienne.
    Retourne une chaîne de deux chiffres (ex: '16') ou None si non trouvé.
    """
    if pd.isna(valeur) or valeur is None:
        return None
        
    val_str = str(valeur).strip()
    norm = normaliser_texte(val_str)
    if not norm:
        return None

    # 1. Vérifie si la valeur commence ou contient exactement un code wilaya numérique (01 à 58 ou 1 à 58)
    num_match = re.match(r'^(?:0?([1-9])|([1-5][0-8]))(?:\s+|$|[^0-9])', norm)
    if num_match:
        code_num = num_match.group(1) or num_match.group(2)
        return code_num.zfill(2)

    # 2. Correspondance intelligente par mots-clés de communes ou régions connues
    communes_mapping = {
        # Boumerdès (35)
        "35": ["ouled moussa", "ouled-moussa", "boumerdes", "moussa", "corso", "thénia", "khemis el khechna"],
        # Alger (16)
        "16": [
            "alger", "algiers", "beaulieu", "el harrach", "harrach", "bab ezzouar", "bab-ezzouar",
            "cheraga", "baraki", "kouba", "reghaia", "bouzareah", "hydra", "dely ibrahim", "dely-ibrahim",
            "birtouta", "bir mourad rais", "draria", "zeralda", "ain taya", "bordj el kiffan", "husein dey"
        ],
        # Blida (09)
        "09": ["blida", "boufarik", "ouled yaich", "mouzaia", "baba ali"],
        # Oran (31)
        "31": ["oran", "bir el djir", "es senia", "arzew"],
        # Constantine (25)
        "25": ["constantine", "el khroub", "hamma bouziane"],
        # Béjaïa (06)
        "06": ["bejaia", "amizour", "akbou", "sidi aich", "el kseur"],
        # Tizi Ouzou (15)
        "15": ["tizi", "ouzou", "azazga", "draa el mizan", "larbaa nath irathen"],
        # Bouira (10)
        "10": ["bouira", "lakhdaria", "sour el ghozlane"],
        # Tipaza (42)
        "42": ["tipaza", "kolea", "bou ismail", "hadjout"]
    }

    # Test des communes connues
    for code, keywords in communes_mapping.items():
        if any(kw in norm for kw in keywords):
            return code

    # 3. Correspondance directe avec les noms de wilayas standards
    for code, nom in WILAYAS_ALGERIE.items():
        nom_norm = normaliser_texte(nom)
        if nom_norm in norm:
            return code

    return None

def main():
    print("🚀 Début du script de nettoyage et conversion des Wilayas...")
    
    # Chemins possibles du fichier Excel
    chemins_possibles = [
        "Kacel_Sante_Migration_Total.xlsx",
        "../Downloads/Kacel_Sante_Migration_Total.xlsx",
        "Kacel Sante Migration Total.xlsx"
    ]
    
    excel_path = None
    for chemin in chemins_possibles:
        if os.path.exists(chemin):
            excel_path = chemin
            break
            
    if not excel_path:
        # Demande à l'utilisateur si aucun trouvé automatiquement
        excel_path = input("👉 Veuillez entrer le chemin exact de votre fichier Excel (ex: mon_fichier.xlsx) : ").strip()
        if not os.path.exists(excel_path):
            print(f"❌ Erreur : Le fichier '{excel_path}' est introuvable.")
            return

    print(f"🔄 Lecture du fichier : {excel_path}...")
    try:
        xls = pd.ExcelFile(excel_path)
    except Exception as e:
        print(f"❌ Erreur lors de l'ouverture du fichier Excel : {e}")
        return

    # Identification de la feuille Patient
    feuille_patient = None
    for sheet in xls.sheet_names:
        if "patient" in sheet.lower():
            feuille_patient = sheet
            break
            
    if not feuille_patient:
        print(f"⚠️ Attention : Aucune feuille contenant 'Patient' n'a été trouvée.")
        print(f"Feuilles disponibles : {xls.sheet_names}")
        feuille_patient = xls.sheet_names[0]
        print(f"👉 Utilisation de la première feuille par défaut : '{feuille_patient}'")
    else:
        print(f"✅ Feuille identifiée pour les patients : '{feuille_patient}'")

    # Lecture des données
    try:
        df = pd.read_excel(excel_path, sheet_name=feuille_patient)
    except Exception as e:
        print(f"❌ Erreur lors de la lecture de la feuille '{feuille_patient}' : {e}")
        return

    print(f"📊 Nombre de lignes chargées : {len(df)}")
    print(f"📋 Colonnes trouvées : {list(df.columns)}")

    # Identification de la colonne Wilaya / Région
    colonne_wilaya = None
    mots_cles_wilaya = ["wilaya", "region", "adresse", "ville", "provenance", "commune"]
    for col in df.columns:
        col_norm = normaliser_texte(str(col))
        if any(mc in col_norm for mc in mots_cles_wilaya):
            colonne_wilaya = col
            break

    if not colonne_wilaya:
        print("\n❌ Impossible de détecter automatiquement la colonne contenant la Wilaya.")
        print("Voici vos colonnes :")
        for i, col in enumerate(df.columns):
            print(f"  {i}: {col}")
        idx = int(input("👉 Veuillez entrer le numéro de la colonne qui contient la Wilaya/Région : "))
        colonne_wilaya = df.columns[idx]

    print(f"🎯 Colonne cible sélectionnée : '{colonne_wilaya}'")

    # Sauvegarde de la colonne d'origine en cas de problème de récupération
    # et création d'une nouvelle colonne propre ou remplacement progressif sécurisé sans perte !
    col_propre = "Code_Wilaya" if "Code_Wilaya" not in df.columns else "Code_Wilaya_Nettoye"
    
    codes_nettoyes = []
    modifications = 0
    non_identifies = 0

    for idx, row in df.iterrows():
        valeur_brute = row[colonne_wilaya]
        code_detecte = detecter_wilaya(valeur_brute)
        
        if code_detecte:
            codes_nettoyes.append(code_detecte)
            if str(valeur_brute).strip() != code_detecte:
                modifications += 1
        else:
            # SÉCURITÉ CRITIQUE : Si aucun code n'est identifié, 
            # on garde la valeur originale OU on met un code par défaut (ex: "16")
            # mais on NE LAISSE JAMAIS VIDE si la valeur originale existait !
            if pd.notna(valeur_brute) and str(valeur_brute).strip():
                # On conserve la valeur textuelle originale en secours 
                # pour que les données ne soient pas perdues !
                codes_nettoyes.append(str(valeur_brute).strip())
                non_identifies += 1
            else:
                codes_nettoyes.append("16") # Par défaut Alger

    df[col_propre] = codes_nettoyes

    print("\n🟢 Analyse terminée !")
    print(f"   🔹 Valeurs converties avec succès en code : {modifications}")
    print(f"   🔹 Valeurs non identifiées conservées intactes (sans perte) : {non_identifies}")
    print(f"   🔹 Nouvelle colonne créée : '{col_propre}'")

    # Si nécessaire, on ajoute aussi une colonne pour la Commune/Ville si détectée
    communes_detectees = []
    for idx, row in df.iterrows():
        val_str = str(row[colonne_wilaya]).strip()
        norm = normaliser_texte(val_str)
        if "ouled moussa" in norm or "ouled-moussa" in norm:
            communes_detectees.append("Ouled Moussa")
        elif "beaulieu" in norm:
            communes_detectees.append("Beaulieu")
        elif "el harrach" in norm or "harrach" in norm:
            communes_detectees.append("El Harrach")
        elif "bab ezzouar" in norm or "bab-ezzouar" in norm:
            communes_detectees.append("Bab Ezzouar")
        elif "cheraga" in norm:
            communes_detectees.append("Chéraga")
        else:
            communes_detectees.append("")
            
    if any(communes_detectees):
        df["Commune_Detectee"] = communes_detectees
        print("   🔹 Colonne 'Commune_Detectee' ajoutée pour préserver les localités !")

    # Sauvegarde sécurisée du fichier sous un nouveau nom pour ne pas écraser l'original !
    nom_fichier, ext = os.path.splitext(excel_path)
    sauvegarde_path = f"{nom_fichier}_Nettoye{ext}"
    
    print(f"\n💾 Sauvegarde du fichier vers : {sauvegarde_path} ...")
    try:
        df.to_excel(sauvegarde_path, index=False)
        print("🎉 Opération réussie ! Les données ont été nettoyées sans aucune perte de colonnes.")
    except Exception as e:
        print(f"❌ Erreur lors de la sauvegarde : {e}")

if __name__ == "__main__":
    main()
