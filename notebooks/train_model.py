import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
import numpy as np
import pickle

IMG_SIZE = 224
BATCH_SIZE = 4
EPOCHS = 15

# =========================
# LOAD DATA
# =========================

train_df = pd.read_csv(
    "datasets/pad_ufes_20/train_final.csv"
)

val_df = pd.read_csv(
    "datasets/pad_ufes_20/val_final.csv"
)

# =========================
# LABEL ENCODING
# =========================

le = LabelEncoder()

train_df["label"] = le.fit_transform(
    train_df["diagnostic"]
)

val_df["label"] = le.transform(
    val_df["diagnostic"]
)

with open(
    "models/label_encoder.pkl",
    "wb"
) as f:
    pickle.dump(le, f)

print("\nClasses:")
print(le.classes_)

print("\nTrain Distribution:")
print(train_df["label"].value_counts())

print("\nValidation Distribution:")
print(val_df["label"].value_counts())

NUM_CLASSES = len(le.classes_)

# =========================
# CLASS WEIGHTS
# =========================

weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(train_df["label"]),
    y=train_df["label"]
)

class_weights = {
    i: weights[i]
    for i in range(len(weights))
}

print("\nClass Weights:")
print(class_weights)

# =========================
# IMAGE LOADER
# =========================

def load_image(path, label):

    image = tf.io.read_file(path)

    image = tf.image.decode_png(
        image,
        channels=3
    )

    image = tf.image.resize(
        image,
        (IMG_SIZE, IMG_SIZE)
    )

    image = image / 255.0

    return image, label

# =========================
# TF DATASETS
# =========================

train_ds = tf.data.Dataset.from_tensor_slices(
    (
        train_df["image_path"].values,
        train_df["label"].values
    )
)

val_ds = tf.data.Dataset.from_tensor_slices(
    (
        val_df["image_path"].values,
        val_df["label"].values
    )
)

train_ds = (
    train_ds
    .map(
        load_image,
        num_parallel_calls=tf.data.AUTOTUNE
    )
    .shuffle(1000)
    .batch(BATCH_SIZE)
    .prefetch(tf.data.AUTOTUNE)
)

val_ds = (
    val_ds
    .map(
        load_image,
        num_parallel_calls=tf.data.AUTOTUNE
    )
    .batch(BATCH_SIZE)
    .prefetch(tf.data.AUTOTUNE)
)

# =========================
# AUGMENTATION
# =========================

augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.15),
    layers.RandomZoom(0.15),
    layers.RandomContrast(0.10)
])

# =========================
# EFFICIENTNET
# =========================

base_model = EfficientNetB0(
    include_top=False,
    weights="imagenet",
    input_shape=(224, 224, 3)
)

# Fine-tune last layers

base_model.trainable = True

for layer in base_model.layers[:-20]:
    layer.trainable = False

# =========================
# MODEL
# =========================

inputs = layers.Input(
    shape=(224, 224, 3)
)

x = augmentation(inputs)

x = base_model(
    x,
    training=False
)

x = layers.GlobalAveragePooling2D()(x)

x = layers.BatchNormalization()(x)

x = layers.Dropout(0.4)(x)

x = layers.Dense(
    256,
    activation="relu"
)(x)

x = layers.Dropout(0.3)(x)

outputs = layers.Dense(
    NUM_CLASSES,
    activation="softmax"
)(x)

model = models.Model(
    inputs,
    outputs
)

# =========================
# COMPILE
# =========================

model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=1e-5
    ),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# =========================
# CALLBACKS
# =========================

callbacks = [

    EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True
    ),

    ModelCheckpoint(
        "models/best_skin_model.keras",
        monitor="val_loss",
        save_best_only=True
    )
]

# =========================
# TRAIN
# =========================

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    class_weight=class_weights,
    callbacks=callbacks
)

# =========================
# SAVE
# =========================

model.save(
    "models/final_skin_model.keras"
)

print("\nTraining Complete.")