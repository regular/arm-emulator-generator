cat - > _cond.s <<"HERE_ASM"
.global main
.text
main:
        @ Stack the return address (lr) in addition to a dummy register (ip) to  
        @ keep the stack 8-byte aligned. 
        push    {ip, lr}

        @ Load the argument and perform the call. This is like 'printf("...")' in C.  
        ldr     r0, =output

        mov r2, #16  @ count down cpsr flags
loop:   SUBS r2, r2, #1
        mrs r1, cpsr
        AND r1, r1, #0x0FFFFFFF
        ORR r1, r2, LSL #28
        msr cpsr_all, r1
        mov r4, #49
        
	add r6, r0, #15
	sub r6, r6, r2

        STREQB r4, [r6, #0*17]
        STRneB r4, [r6, #1*17]
        STRhsB r4, [r6, #2*17]
        STRloB r4, [r6, #3*17]
        STRmiB r4, [r6, #4*17]
        STRplB r4, [r6, #5*17]
        STRvsB r4, [r6, #6*17]
        STRvcB r4, [r6, #7*17]
        STRhiB r4, [r6, #8*17]
        STRleB r4, [r6, #9*17]
        STRgeB r4, [r6, #10*17]
        STRltB r4, [r6, #11*17]
        STRgtB r4, [r6, #12*17]
        STRleB r4, [r6, #13*17]
        STRalB r4, [r6, #14*17]

        cmp r2, #0
        bne loop

print:  
        ldr     r0, =message
        bl      printf  

        @ Exit from 'main'. This is like 'return 0' in C.  
        mov     r0, #0    @ Return 0.  

        @ Pop the dummy ip to reverse our alignment fix, and pop the original lr  
        @ value directly into pc — the Program Counter — to return.  
        pop     {ip, pc}  

.data
message:
	.ascii "# Pipe me through `bc`\n"
	.ascii "obase=10\n"
	.ascii "ibase=2\n"
output:
        .rept 16
        .space 16, 48; .ascii "\n"
        .endr
HERE_ASM
gcc -o _cond _cond.s && ./_cond | bc | awk '{ printf("0x%04X,\n", $1) }'

