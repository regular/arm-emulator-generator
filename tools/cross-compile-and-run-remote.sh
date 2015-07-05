arm-none-eabi-gcc -mlittle-endian -c $1 -o temp.o &&
cat temp.o | ssh $2 "cat - > runme && chmod +x runme && ./runme"
