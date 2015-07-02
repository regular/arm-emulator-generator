add r0, r1, r0
add r0, r1, r15

add r0, r1, #0
add r0, r1, #0xff0

add r0, r1, r0, LSL #1
add r0, r1, r15, LSL #6
add r0, r1, r0, LSL #2
add r0, r1, r0, LSL #15

add r0, r1, r0, LSR #1
add r0, r1, r0, LSR #2
add r0, r1, r0, LSR #15
add r0, r1, r0, LSR #30

add r0, r1, r15, LSL #30
add r0, r1, r15, ASL #30
add r0, r1, r15, LSR #1
add r0, r1, r15, ASR #1
add r0, r1, r15, ROR #0
add r0, r1, r15, ROR #1
add r0, r1, r15, ROR #2
add r0, r1, r15, RRX

add r0, r1, r15, LSL r0
add r0, r1, r15, LSL r2
add r0, r1, r15, LSL r4
add r0, r1, r15, LSL r15

AND r0, r1, r0
EOR r0, r1, r0
SUB r0, r1, r0
RSB r0, r1, r0
ADD r0, r1, r0
ADC r0, r1, r0
SBC r0, r1, r0
RSC r0, r1, r0
TST r1, r0
TEQ r1, r0
CMP r1, r0
CMN r1, r0
ORR r0, r1, r0
BIC r0, r1, r0
MVN r0, r1
MOV r0, r1

