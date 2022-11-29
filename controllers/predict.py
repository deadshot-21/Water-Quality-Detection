
# import pickle
import sys
import tensorflow as tf
# with open(r"model.pkl", "rb") as input_file:
#   m = pickle.load(input_file)
m = tf.keras.models.load_model('model.pb')

# from load import m

for i in range(1,len(sys.argv)):
  sys.argv[i] = float(sys.argv[i])
res = m.predict([sys.argv[1:]])
print(res)
# print(m.predict([sys.argv[1:]]))