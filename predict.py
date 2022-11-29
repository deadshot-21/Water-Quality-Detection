
import pickle
import sys
import tensorflow as tf
# with open('model.p', "rb") as input_file:
#   m = pickle.load(input_file)
# filename = 'model.pkl'
# m = pickle.load(open(filename, 'rb'))
m = tf.keras.models.load_model('model.pb')
for i in range(len(sys.argv)):
  print(sys.argv[i])
  # sys.argv[i] = float(sys.argv[i])
# print(m.predict([sys.argv]))