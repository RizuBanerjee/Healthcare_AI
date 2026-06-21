from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import tensorflow as tf
from PIL import Image
import numpy as np
from dotenv import load_dotenv
from groq import Groq
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

model = pickle.load(
    open("models/symptom_model.pkl", "rb")
)

encoder = pickle.load(
    open("models/symptom_encoder.pkl", "rb")
)

skin_model = pickle.load(
    open("models/skin_metadata_model.pkl", "rb")
)

skin_encoder = pickle.load(
    open("models/skin_metadata_encoder.pkl", "rb")
)

skin_feature_columns = pickle.load(
    open("models/skin_feature_columns.pkl", "rb")
)

training_df = pd.read_csv(
    "datasets/disease_symptoms/Training.csv"
)

symptom_cols = list(
    training_df.drop("prognosis", axis=1).columns
)

skin_image_model = tf.keras.models.load_model(
    "models/best_skin_model.keras"
)

image_encoder = pickle.load(
    open("models/label_encoder.pkl", "rb")
)

def get_explanation(disease):

    explanations = {

        "Fungal infection":
        "A fungal infection affects the skin and may cause itching, redness and rashes.",

        "Tuberculosis":
        "Tuberculosis is a bacterial infection that mainly affects the lungs and requires medical treatment.",

        "Malaria":
        "Malaria is a mosquito-borne disease causing fever, chills and fatigue.",

        "Actinic Keratosis":
        "Actinic keratosis is a rough skin patch caused by long-term sun exposure.",

        "Basal Cell Carcinoma":
        "Basal cell carcinoma is a common type of skin cancer that grows slowly.",

        "Melanoma":
        "Melanoma is a serious form of skin cancer that requires urgent medical attention."
    }

    return explanations.get(
        disease,
        "Consult a healthcare professional for detailed guidance."
    )

@app.route("/symptoms")
def symptoms():

    return jsonify(
        sorted(symptom_cols)
    )

@app.route("/symptoms_list", methods=["GET"])
def symptoms_list():

    return jsonify(
        sorted(symptom_cols)
    )

@app.route("/predict_symptoms", methods=["POST"])
def predict():

    selected = request.json

    row = {}

    for col in symptom_cols:
        row[col] = 0

    for symptom in selected:
        if symptom in row:
            row[symptom] = 1

    df = pd.DataFrame([row])

    pred = model.predict(df)[0]

    disease = str(encoder.inverse_transform([pred])[0])

    probs = model.predict_proba(df)[0]

    print("Predicted Disease:",
        encoder.inverse_transform([pred])[0])

    print("Active Symptoms:")

    for c in df.columns:
        if df[c].iloc[0] == 1:
            print(c)
            
    print(probs)
    print(max(probs))
    confidence = float(probs.max() * 100)
    confidence = round(confidence, 2)

    high_risk = [
        "Tuberculosis",
        "Pneumonia",
        "Heart attack",
        "AIDS",
        "Hepatitis B",
        "Hepatitis C"
    ]

    medium_risk = [
        "Malaria",
        "Typhoid",
        "Dengue"
    ]

    if disease in high_risk:
        risk = "High"
    elif disease in medium_risk:
        risk = "Medium"
    else:
        risk = "Low"

    doctor_map = {
        "Tuberculosis":"Pulmonologist",
        "Pneumonia":"Pulmonologist",
        "Heart attack":"Cardiologist",
        "Diabetes":"Endocrinologist",
        "Acne":"Dermatologist",
        "Psoriasis":"Dermatologist"
    }

    doctor = doctor_map.get(
        disease,
        "General Physician"
    )

    return jsonify({
        "disease": str(disease),
        "confidence": float(confidence),
        "risk_level": str(risk),
        "recommended_doctor": str(doctor)
    })

@app.route("/predict_skin", methods=["POST"])
def predict_skin():

    data = request.json

    df = pd.DataFrame([data])

    for c in df.columns:
        df[c] = df[c].astype(str)

    df = pd.get_dummies(df)

    df = df.reindex(
        columns=skin_feature_columns,
        fill_value=0
    )

    pred = skin_model.predict(df)[0]

    disease = str(
        skin_encoder.inverse_transform([pred])[0]
    )

    probs = skin_model.predict_proba(df)[0]

    confidence = round(
        float(max(probs) * 100),
        2
    )

    skin_name_map = {
        "ACK": "Actinic Keratosis",
        "BCC": "Basal Cell Carcinoma",
        "MEL": "Melanoma",
        "NEV": "Nevus",
        "SCC": "Squamous Cell Carcinoma",
        "SEK": "Seborrheic Keratosis"
    }

    full_name = skin_name_map.get(
        disease,
        disease
    )

    return jsonify({
        "disease_code": disease,
        "disease_name": full_name,
        "confidence": confidence
    })

@app.route("/predict_skin_image", methods=["POST"])
def predict_skin_image():

    file = request.files["image"]

    image = Image.open(file)

    image = image.convert("RGB")

    image = image.resize((224, 224))

    image = np.array(image)

    image = image / 255.0

    image = np.expand_dims(
        image,
        axis=0
    )

    pred = skin_image_model.predict(image)

    class_id = np.argmax(pred)

    confidence = round(
        float(np.max(pred) * 100),
        2
    )

    disease_code = image_encoder.inverse_transform(
        [class_id]
    )[0]

    disease_map = {
        "ACK": "Actinic Keratosis",
        "BCC": "Basal Cell Carcinoma",
        "MEL": "Melanoma",
        "NEV": "Nevus",
        "SCC": "Squamous Cell Carcinoma",
        "SEK": "Seborrheic Keratosis"
    }

    return jsonify({
        "disease_code": disease_code,
        "disease_name": disease_map.get(
            disease_code,
            disease_code
        ),
        "confidence": confidence
    })

@app.route("/health_report", methods=["POST"])
def health_report():

    data = request.json

    # -------------------
    # Symptom Prediction
    # -------------------

    symptoms = data.get("symptoms", [])

    row = {}

    for col in symptom_cols:
        row[col] = 0

    for symptom in symptoms:
        if symptom in row:
            row[symptom] = 1

    symptom_df = pd.DataFrame([row])

    symptom_pred = model.predict(symptom_df)[0]

    symptom_disease = str(
        encoder.inverse_transform([symptom_pred])[0]
    )

    symptom_probs = model.predict_proba(symptom_df)[0]

    symptom_confidence = round(
        float(max(symptom_probs) * 100),
        2
    )

    # -------------------
    # Skin Prediction
    # -------------------

    skin_data = data.get("skin_data", {})

    skin_df = pd.DataFrame([skin_data])

    for c in skin_df.columns:
        skin_df[c] = skin_df[c].astype(str)

    skin_df = pd.get_dummies(skin_df)

    skin_df = skin_df.reindex(
        columns=skin_feature_columns,
        fill_value=0
    )

    skin_pred = skin_model.predict(skin_df)[0]

    skin_disease = str(
        skin_encoder.inverse_transform([skin_pred])[0]
    )

    skin_probs = skin_model.predict_proba(skin_df)[0]

    skin_confidence = round(
        float(max(skin_probs) * 100),
        2
    )

    skin_name_map = {
        "ACK": "Actinic Keratosis",
        "BCC": "Basal Cell Carcinoma",
        "MEL": "Melanoma",
        "NEV": "Nevus",
        "SCC": "Squamous Cell Carcinoma",
        "SEK": "Seborrheic Keratosis"
    }

    skin_name = skin_name_map.get(
        skin_disease,
        skin_disease
    )

    import sqlite3

    conn = sqlite3.connect("healthcare.db")

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO reports
        (
            symptom_disease,
            symptom_confidence,
            skin_disease,
            skin_confidence
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            symptom_disease,
            symptom_confidence,
            skin_name,
            skin_confidence
        )
    )

    conn.commit()
    conn.close()

    explanation = get_explanation(
        symptom_disease
    )

    high_risk = [
        "Tuberculosis",
        "Pneumonia",
        "Heart attack",
        "AIDS",
        "Hepatitis B",
        "Hepatitis C"
    ]

    medium_risk = [
        "Malaria",
        "Typhoid",
        "Dengue"
    ]

    if symptom_disease in high_risk:
        risk = "High"
    elif symptom_disease in medium_risk:
        risk = "Medium"
    else:
        risk = "Low"

    doctor_map = {
        "Tuberculosis":"Pulmonologist",
        "Pneumonia":"Pulmonologist",
        "Heart attack":"Cardiologist",
        "Diabetes":"Endocrinologist",
        "Acne":"Dermatologist",
        "Psoriasis":"Dermatologist"
    }

    doctor = doctor_map.get(
        symptom_disease,
        "General Physician"
    )

    return jsonify({

        "symptom_prediction": {
            "disease": symptom_disease,
            "confidence": symptom_confidence,
            "risk_level": risk,
            "recommended_doctor": doctor
        },

        "skin_prediction": {
            "disease_code": skin_disease,
            "disease_name": skin_name,
            "confidence": skin_confidence
        },

        "explanation": explanation

    })

@app.route("/reports")
def reports():

    import sqlite3

    conn = sqlite3.connect("healthcare.db")

    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    rows = cursor.execute(
        "SELECT * FROM reports ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify(
        [dict(row) for row in rows]
    )

@app.route("/stats")
def stats():

    import sqlite3

    conn = sqlite3.connect(
        "healthcare.db"
    )

    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM reports"
    )

    total = cursor.fetchone()[0]

    cursor.execute("""
    SELECT symptom_disease,
    COUNT(*)
    FROM reports
    GROUP BY symptom_disease
    ORDER BY COUNT(*) DESC
    LIMIT 1
    """)

    common = cursor.fetchone()

    conn.close()

    return jsonify({
        "total_reports": total,
        "most_common":
        common[0] if common else "N/A"
    })
    
@app.route("/chat", methods=["POST"])
def chat():

    data = request.json

    message = data.get("message", "")

    if not message:
        return jsonify({
            "error": "message required"
        }), 400

    try:

        completion = client.chat.completions.create(

            model="llama-3.3-70b-versatile",

            messages=[

                {
                    "role": "system",
                    "content":
                    """
                    You are Healthcare AI Assistant.

                    Explain diseases,
                    symptoms,
                    precautions,
                    diet,
                    and doctor recommendations.

                    Never provide a diagnosis.
                    """
                },

                {
                    "role": "user",
                    "content": message
                }

            ]

        )

        reply = completion.choices[0].message.content

        return jsonify({
            "reply": reply
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True)