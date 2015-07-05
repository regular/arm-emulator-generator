arm-none-eabi-gcc -mlittle-endian -c $1 -o test.o
arm-none-eabi-objdump --disassemble test.o
arm-none-eabi-objcopy --only-section=.text --output-target binary test.o test.bin
hexdump -e '/4 "%08X\n"' test.bin

