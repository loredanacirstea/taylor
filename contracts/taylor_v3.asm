// %0 = freeMemPtr, %1 = current_frame_ptr, %2 = number of frame slots
// on stack: return tag, extra_ptr, output_ptr, partials_ptr, input_ptr, prev_ptr













dataSize(sub_0)
    dataOffset(sub_0)
    0x00
    codecopy
    dataSize(sub_0)
    0x00
    return
    stop

    sub_0: assembly {
























        // GETTERS  //





















        // SETTERS  //

























        // start tag value - native functions
        /* (0) mmstore 0xa0, stop_00      */
stop_00
    0xa0
    mstore

        // tag for returning from native function
        /* (1) mmstore 0xc0, tag_eval      */
tag_eval
    0xc0
    mstore

        // 0xe0 - current memory frame

        // copy input data in memory
        /* (0) calld 0x100     // data_ptr   // data_ptr   */
calldatasize
    0x00
    0x100     // data_ptr
    calldatacopy

        // freeMemPtr
        0x100
        calldatasize
        add
        0x40
        mstore

        // prepare memory frame
        // TODO alloc mem frame before anything else, so we can dealloc everything once

        // MEMORY FRAME
        // 0x00 previous pointer
        // 0x20 data_ptr
        // 0x40 env_ptr
        // 0x60 0/1 memory or stack
        // 0x80 partials_ptr - t3 (depends on function arity)
        // 0xa0 output_ptr - pointer where to write the outputs one after another
        // 0xc0 for loop step number
        // 0xe0 for loop end
        // 0x100 for loop return tag
        // 0x120 eval return tag
        // 0x140 0/1 delete/don't delete

        // for stack we use: 0x00 - 0x40, 0xa0-0x120

        // MEMORY FRAME INIT
        0x160
        /* (0) allocate 0x40      */
0x40
    mload
    swap1
    dup2
    add
    0x40
    mstore

        // store current_frame_ptr
        dup1
        0xe0
        mstore

        // everything is 0 except:
        0x100   // data_ptr
        dup2
        /* (0) setdataptr //   //   */
0x20
            add
            mstore

        tag_return    // return tag
        swap1
        /* (0) setreturn //   //   */
0x120
            add
            mstore

    tag_eval:
        /* (0) getframe //   //   */
0xe0
            mload
        /* (0) getdataptr //   //   */
0x20
            add
            mload
        mload          // data
        /* (0) getrootid //   //   */
// expects a 32bytes value
            0xfc
            shr

        dup1
        0x01
        eq
        eval_is_number
        jumpi

        dup1
        0x03
        eq
        eval_is_fn
        jumpi

        0x04
        eq
        eval_is_bytelike
        jumpi

    eval_end_processing:
            // current_frame_ptr, result_ptr, end_ptr on stack
            dup3
            /* (0) getloco //   //   */
0x60
            add
            mload

            0x01
            eq
            eval_end_processing_mem
            jumpi

            dup3      // current_frame_ptr, result_ptr, end_ptr, memframe_ptr
            /* (0) getoutputptr //   //   */
0xa0
            add
            mload
            mload  // actual output_ptr // current_frame_ptr, result_ptr, end_ptr, output_ptr

            0x20
            add
            mstore   // current_frame_ptr, result_ptr

            swap1 // frame, result_ptr -> result_ptr, frame

            /* (0) getreturn // load tag to jump from current frame   // load tag to jump from current frame   */
0x120
            add
            mload
            jump
    eval_end_processing_mem:

            // current_frame_ptr, result_ptr, end_ptr on stack
            dup3      // current_frame_ptr, result_ptr, end_ptr, frame_ptr
            /* (1) getoutputptr //   current_frame_ptr, result_ptr, end_ptr, output_ptr   //   current_frame_ptr, result_ptr, end_ptr, output_ptr   */
0xa0
            add
            mload
            mload  // actual output_ptr // current_frame_ptr, result_ptr, end_ptr, output_ptr

            swap1   // current_frame_ptr, result_ptr, output_ptr, end_ptr
            dup2    // current_frame_ptr, result_ptr, output_ptr, end_ptr, output_ptr

            0x20
            add     // current_frame_ptr, result_ptr, output_ptr, end_ptr, output_ptr
            mstore   // current_frame_ptr, result_ptr, output_ptr

            0x40
            add
            mstore   // current_frame_ptr

            /* (1) getreturn // load tag to jump from current frame   // load tag to jump from current frame   */
0x120
            add
            mload
            jump

    tag_return:
        /* (1) getframe //   //   */
0xe0
            mload
        /* (1) getloco //   //   */
0x60
            add
            mload

        0x01
        eq
        tag_return_mem
        jumpi

        // answer is on stack
        0x00
        mstore
        0x20
        0x00
        return
    tag_return_mem:
        0x00           // here is output_ptr
        mload
        /* (0) t3item_ 0x01   // result_ptr   // result_ptr   */
// expects 0x01   // result_ptr = index and t3 pointer on stack
    // TODO revert when out of bounds
    0x01   // result_ptr
    0x20
    mul
    0x20
    add
    add
    mload
        0x00
        mstore
        0x20
        0x00
        return

    eval_is_number:
            pop     // eval switch condition
            /* (2) getframe //   //   */
0xe0
            mload

            dup1
            /* (1) getdataptr //   //   */
0x20
            add
            mload

            dup1    // get value - this is result_ptr
            0x04    // add 4bytes sig
            add
            mload   // result_ptr is value

            swap1       // data_ptr first
            0x24
            add        // end_ptr

            eval_end_processing   // current_frame_ptr, result_ptr, end_ptr on stack TODO should be macro
            jump

    eval_is_bytelike:
        /* (3) getframe //   //   */
0xe0
            mload

        dup1
        /* (2) getdataptr // frame_ptr, data_ptr   // frame_ptr, data_ptr   */
0x20
            add
            mload

        dup1        // frame_ptr, data_ptr, data_ptr
        0x04
        add
        /* (0) getfourb //  frame_ptr, data_ptr, bytes length   //  frame_ptr, data_ptr, bytes length   */
// expects a pointer
            mload
            0xe0
            shr

        dup1        //frame_ptr,  data_ptr, length, length
        0x20
        add
        /* (1) allocate 0x40  // frame_ptr, data_ptr, length, result_ptr   // frame_ptr, data_ptr, length, result_ptr   */
0x40  // frame_ptr
    mload
    swap1
    dup2
    add
    0x40  // frame_ptr
    mstore

        dup2    // frame_ptr, data_ptr, length, result_ptr, length
        dup2    // result_ptr
        mstore  // frame_ptr, data_ptr, length, result_ptr

        0x01
        dup5
        /* (0) setdelmarker // do not delete frame   // do not delete frame   */
0x140
            add
            mstore

        dup2    // length
        dup4     // source_ptr
        0x08
        add
        dup3     // target_ptr/result_ptr
        0x20
        add

        /* (0) mmultimstore //   //   */
// alloc before using it
            // size_bytes, source_ptr, target_ptr
            dup3   // size_bytes

            // calc slots
            0x20
            dup2
            div

            0x00
            0x20
            dup4
            mod
            gt
            add

            swap1
            pop

            // end calc slots

            swap3            // slots, source_ptr, target_ptr ; replace length with slots
            pop

            mmultimstore_end_0
            dup4             // slots
            0x00

for_stack_0:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_0
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_0:   // any content variables are kept after jumptag, end, step

                // slots, source_ptr, target_ptr, tag, end, step
                dup5
                mload
                dup5
                mstore

                dup5
                0x20
                add
                swap5
                pop

                dup4
                0x20
                add
                swap4
                pop

    forloop_end_stack_0:
        0x01   // start/step first
        add
        for_stack_0
        jump
        mmultimstore_end_0:
            pop
            pop
            pop

        dup3      // data_ptr
        0x08
        add
        dup3      // length
        add       // frame_ptr, data_ptr, length, result_ptr, data_ptr
        swap2     // frame_ptr, data_ptr, data_ptr, result_ptr, length
        pop       // frame_ptr, data_ptr, data_ptr, result_ptr
        swap2     // frame_ptr, result_ptr, data_ptr, data_ptr
        pop



        // current_frame_ptr, result_ptr, end_ptr
        eval_end_processing
        jump


    eval_is_fn:
        pop  // pop above switch condition
        /* (4) getframe //   //   */
0xe0
            mload

        dup1
        /* (3) getdataptr //   //   */
0x20
            add
            mload

        dup1
        0x08
        add      // end_ptr

        dup2      // data_ptr
        /* (1) getfourb //   //   */
// expects a pointer
            mload
            0xe0
            shr
        dup1
        /* (0) getfuncarity //   //   */
// expects a 4byte value
            0x3f
            and

        swap1
        /* (0) getfuncloco //   //   */
// expects a 4byte value
            0x40
            and
            0x40
            eq   // returns 0 (stack) or 1 (memory)
        dup5      // frame ptr
        /* (0) setloco //   //   */
0x60
            add
            mstore

        dup1       // arity - no of partials one for arity
        0x01
        add
        /* (0) t3_init__ 0x40   // partials_ptr   // partials_ptr   */
// expects on stack: arity
    dup1   // arity
    0x20
    mul
    0x20
    add

    // alloc 0x40   // partials_ptr    // freeMemPtr
    0x40   // partials_ptr
    mload
    swap1
    dup2
    add
    0x40   // partials_ptr
    mstore

    swap1    // ptr, arity
    dup2     // ptr, arity, ptr
    mstore   // store arity at pointer -> ptr

        dup1      // partials_ptr
        0x20      // partial ptr to store new end_ptr and arity - fake partial
        add

        dup3   // arity is result_ptr
        dup5   // end_ptr
        0x02
        /* (0) t3__ 0x40  // partial1   // partial1   */
// expects on stack: inputs, arity
    dup1   // arity
    0x20
    mul
    0x20
    add


    // alloc 0x40  // partial1    // freeMemPtr
    0x40  // partial1
    mload
    swap1
    dup2
    add
    0x40  // partial1
    mstore

    dup2   // store arity
    dup2   // ptr
    mstore

    swap1  // arity last

    dup2   // initial pointer

    0x20   // ptr increase
    add

    swap1  // arity last

    t3__1_0    // store inputs at pointer ; inputs, iniptr, current_ptr, arity, tag
    swap1     // inputs, iniptr, current_ptr, tag, arity
    0x00

for_stack_1:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_1
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_1:   // any content variables are kept after jumptag, end, step

        // inputs, iniptr, current_ptr, tag, end, step
        dup6       // store first input
        dup5       // current_ptr
        mstore
        dup4       // increase current_ptr with 32
        0x20
        add
        swap4      // replace current_ptr
        pop
        swap1
        swap2
        swap3
        swap4
        swap5
        pop      // inputs_rest, ptr, tag, end, step

    forloop_end_stack_1:
        0x01   // start/step first
        add
        for_stack_1
        jump

    t3__1_0:  // after for loop does nothing has ptr last on stack
        pop      // pops increased ptr
        swap1
        mstore     // store partial1

        dup1
        dup6    // frame ptr
        /* (0) setpartialsptr //   //   */
0x80
            add
            mstore

        // prealloc all partials output, so we can dealloc mem later

        // frame_ptr, data_ptr, end_ptr, arity, partial_ptr

        eval_is_fn_rest
        dup3
        0x00

for_stack_2:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_2
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_2:   // any content variables are kept after jumptag, end, step

            // frame_ptr, data_ptr, end_ptr, arity, partial_ptr, tag, end, step
            0x02
            /* (1) t3_init__ 0x40  //partial   //partial   */
// expects on stack: arity
    dup1   // arity
    0x20
    mul
    0x20
    add

    // alloc 0x40  //partial    // freeMemPtr
    0x40  //partial
    mload
    swap1
    dup2
    add
    0x40  //partial
    mstore

    swap1    // ptr, arity
    dup2     // ptr, arity, ptr
    mstore   // store arity at pointer -> ptr

            dup5   // partial_ptr
            dup3   // step
            0x20
            mul
            0x40
            add
            add
            mstore


    forloop_end_stack_2:
        0x01   // start/step first
        add
        for_stack_2
        jump
    eval_is_fn_rest:
        pop   // partial_ptr

        // remove stack except arity
        swap1
        pop
        swap1
        pop
        swap1
        pop

        eval_function_for_end   // arity, tag
        swap1   // tag, arity
        0x00   // start


// expects tag, end, start
    0xe0     // location of current frame ptr
    mload  // current frame ptr
    0xc0     // adding the offset to for data - start_ptr
    add    // the pointer at which the for data should be

    // tag, end, start, start_ptr

    swap3   // start_ptr, end, start, tag
    dup4
    0x40
    add
    mstore   // store tag

    dup3    // start_ptr, end, start, start_ptr
    mstore  // store start

    swap1   // end, start_ptr
    0x20
    add
    mstore  // store end

    for_0:
        0xe0     // location of current frame ptr
        mload  // current frame ptr
        0xc0     // adding the offset to extra_ptr
        add

        dup1    // load end
        0x20
        add
        mload

        swap1
        mload   // load start

        lt
        forloop_0
        jumpi

        0xe0     // location of current frame ptr
        mload  // current frame ptr
        0xc0     // adding the offset to extra_ptr
        add

        0x40   // load tag
        add
        mload
        jump
    forloop_0:

            // create new memory frame
            // nothing on stack

            // step 499

            // MEMORY FRAME INIT  //
            0x160
            /* (2) allocate 0x40      */
0x40
    mload
    swap1
    dup2
    add
    0x40
    mstore

            /* (5) getframe // prev_frame_ptr   // prev_frame_ptr   */
0xe0
            mload
            dup1
            dup3
            mstore  // PREV_PTR(0)

            // store current_frame_ptr
            dup2
            0xe0
            mstore

            dup1   // previous frame ptr is on stack
            /* (0) getenvptr //   //   */
0x40
            add
            mload
            dup3    // new_frame_ptr
            /* (0) setenvptr // ENV_PTR(2)  // TODO - more complex when we have let*   // ENV_PTR(2)  // TODO - more complex when we have let*   */
0x40
            add
            mstore

            dup1     // get mem/stack location from parent
            /* (2) getloco //   //   */
0x60
            add
            mload
            dup3
            /* (1) setloco // MEM/STACK(3) //   if next is a function, it will set the mem/stack location itself   // MEM/STACK(3) //   if next is a function, it will set the mem/stack location itself   */
0x60
            add
            mstore

            dup1
            /* (0) getpartialsptr // from parent   // from parent   */
0x80
            add
            mload

            // new_frame_ptr, previous frame ptr, partials_ptr
            swap1       // new_frame_ptr, partials_ptr, previous frame ptr
            /* (0) getforstep // new_frame_ptr, partials_ptr, step   // new_frame_ptr, partials_ptr, step   */
0xc0
            add
            mload
            0x02    // arity and first artificial partial
            add
            0x20
            mul     // partial ptr offset
            add     // partial ptr for this step -> output_ptr

            // new_frame_ptr, output_ptr
            dup1    // new_frame_ptr, output_ptr, output_ptr
            dup3    // new_frame_ptr, output_ptr, output_ptr, new_frame_ptr
            /* (0) setoutputptr // OUTPUT_PTR(5) //  new_frame_ptr, output_ptr   // OUTPUT_PTR(5) //  new_frame_ptr, output_ptr   */
0xa0
            add
            mstore

            // take data ptr from previous partial
            0x20       // new_frame_ptr, output_ptr, 0x20
            swap1      // partial for this step
            sub       // previous partial
            mload
            /* (1) t3item_ 0x00    // end_ptr is new data_ptr // new_frame_ptr, data_ptr   // end_ptr is new data_ptr // new_frame_ptr, data_ptr   */
// expects 0x00    // end_ptr is new data_ptr // new_frame_ptr = index and t3 pointer on stack
    // TODO revert when out of bounds
    0x00    // end_ptr is new data_ptr // new_frame_ptr
    0x20
    mul
    0x20
    add
    add
    mload

            dup2       // new_frame_ptr, data_ptr, new_frame_ptr
            /* (1) setdataptr // DATA_PTR(1) //   new_frame_ptr   // DATA_PTR(1) //   new_frame_ptr   */
0x20
            add
            mstore

            0x00
            dup2
            /* (1) setpartialsptr // PARTIALS_PTR(4) empty   // PARTIALS_PTR(4) empty   */
0x80
            add
            mstore
            0x00
            dup2
            /* (0) setforstep // LOOP START (6) empty   // LOOP START (6) empty   */
0xc0
            add
            mstore
            0x00
            dup2
            /* (0) setforend // LOOP END (7) empty   // LOOP END (7) empty   */
0xe0
            add
            mstore
            0x00
            dup2
            /* (0) setforreturn // LOOP RETURN (8) empty   // LOOP RETURN (8) empty   */
0x100
            add
            mstore


            eval_function_for_content    // return tag
            swap1
            /* (1) setreturn // EVAL RETURN TAG(9)   // EVAL RETURN TAG(9)   */
0x120
            add
            mstore

            // END - MEMORY FRAME INIT  //

            // step 794 (nothing on stack)

            tag_eval
            jump

            eval_function_for_content:
                /* (6) getframe //   //   */
0xe0
            mload

                mload     // get previous frame
                0xe0
                mstore

    forloop_end_0:

        0xe0     // location of current frame ptr
        mload  // current frame ptr
        0xc0     // adding the offset to extra_ptr
        add    // the pointer at which the extra_ptr should be

        dup1
        mload  // load start

        0x01   // increase start
        add
        swap1
        mstore

        for_0
        jump

    eval_function_for_end:
        /* (7) getframe //   //   */
0xe0
            mload
        /* (3) getloco //   //   */
0x60
            add
            mload

        0x01
        eq
        eval_function_for_end_mem
        jumpi

        /* (8) getframe //   //   */
0xe0
            mload
        /* (4) getdataptr //   //   */
0x20
            add
            mload
        0x04
        add
        /* (2) getfourb //  function id fid   //  function id fid   */
// expects a pointer
            mload
            0xe0
            shr

        0x00  // gets popped in eval_native_function

        eval_native_function
        jump

    test_tag:
        0x00
        mstore
        0x20
        mstore
        0x40
        0x00
        return

    eval_function_for_end_mem:
        /* (9) getframe //   //   */
0xe0
            mload

        dup1
        /* (5) getdataptr //   //   */
0x20
            add
            mload
        0x04
        add
        /* (3) getfourb //  function id fid  // frame_ptr, fid   //  function id fid  // frame_ptr, fid   */
// expects a pointer
            mload
            0xe0
            shr

        // get partials
        swap1   // current_frame_ptr should be parent frame
        /* (1) getpartialsptr // fid, partials_ptr   // fid, partials_ptr   */
0x80
            add
            mload

        dup1        // fid, partials_ptr, partials_ptr
        0x40        // partials without arity and fake first partial
        add         // fid, partials_ptr, actual_partials_start

        swap1    // arity - 1   // fid, actual_partials_start, partials_ptr
        mload    // fid, actual_partials_start, arity
        0x01     // fid, actual_partials_start, arity, 0x01
        swap1
        sub      // fid, actual_partials_start, actual_arity

        eval_native_function   // fid,  current_partial, arity, tag
        swap1  // fid, current_partial, tag, arity
        0x00

for_stack_3:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_3
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_3:   // any content variables are kept after jumptag, end, step

            // fid, current_partial, tag, end, step
            dup4
            mload
            /* (2) t3item_ 0x01   // result_ptr   // result_ptr   */
// expects 0x01   // result_ptr = index and t3 pointer on stack
    // TODO revert when out of bounds
    0x01   // result_ptr
    0x20
    mul
    0x20
    add
    add
    mload
            swap5
            swap4
            0x20
            add
            swap3
            swap2
            swap1

    forloop_end_stack_3:
        0x01   // start/step first
        add
        for_stack_3
        jump

    eval_native_function:
        pop
        // expects args, fid on stack

        eval_native_function_post
        0xc0
        mstore

        dup1  // native pop a value TODO better
        0x08  // instructions per opcode
        mul
        0xa0
        mload
        add
        jump
    eval_native_function_post:
        /* (10) getframe //   //   */
0xe0
            mload
        swap1

        dup2    // frame - get last partial for end_ptr
        /* (2) getpartialsptr //   //   */
0x80
            add
            mload

        dup1
        mload   // arity
        0x20
        mul     // offset to last partial
        add
        mload
        /* (3) t3item_ 0x00      */
// expects 0x00 = index and t3 pointer on stack
    // TODO revert when out of bounds
    0x00
    0x20
    mul
    0x20
    add
    add
    mload

         // current_frame_ptr, result_ptr, end_ptr on stack
        eval_end_processing
        jump




        // we keep 4 instructions per function, for easy pc calculation
        stop_00:  // 0x00
            stop  // the following is not executed
            stop
            stop
            stop
            stop
            stop
            stop
        /* (0) wopcode 0x01, add, add_21      */
add_21:  // 0x01
        pop
        add
        0xc0
        // push
        mload
        jump
        stop
        /* (1) wopcode 0x02, mul, mul_21      */
mul_21:  // 0x02
        pop
        mul
        0xc0
        // push
        mload
        jump
        stop
        /* (2) wopcode 0x03, sub, sub_21      */
sub_21:  // 0x03
        pop
        sub
        0xc0
        // push
        mload
        jump
        stop
        /* (3) wopcode 0x04, div, div_21      */
div_21:  // 0x04
        pop
        div
        0xc0
        // push
        mload
        jump
        stop
        /* (4) wopcode 0x05, sdiv, sdiv_21      */
sdiv_21:  // 0x05
        pop
        sdiv
        0xc0
        // push
        mload
        jump
        stop
        /* (5) wopcode 0x06, mod, mod_21      */
mod_21:  // 0x06
        pop
        mod
        0xc0
        // push
        mload
        jump
        stop
        /* (6) wopcode 0x07, smod, smod_21      */
smod_21:  // 0x07
        pop
        smod
        0xc0
        // push
        mload
        jump
        stop
        /* (7) wopcode 0x08, addmod, addmod_31      */
addmod_31:  // 0x08
        pop
        addmod
        0xc0
        // push
        mload
        jump
        stop
        /* (8) wopcode 0x09, mulmod, mulmod_31      */
mulmod_31:  // 0x09
        pop
        mulmod
        0xc0
        // push
        mload
        jump
        stop
        /* (9) wopcode 0x0a, exp, exp_21      */
exp_21:  // 0x0a
        pop
        exp
        0xc0
        // push
        mload
        jump
        stop
        /* (10) wopcode 0x0b, signextend, signextend_21      */
signextend_21:  // 0x0b
        pop
        signextend
        0xc0
        // push
        mload
        jump
        stop
        /* (0) eopcode 0x0c, 1      */
unused_1:  // 0x0c
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (1) eopcode 0x0d, 2      */
unused_2:  // 0x0d
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (2) eopcode 0x0e, 3      */
unused_3:  // 0x0e
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (3) eopcode 0x0f, 4      */
unused_4:  // 0x0f
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (11) wopcode 0x10, lt, lt_21      */
lt_21:  // 0x10
        pop
        lt
        0xc0
        // push
        mload
        jump
        stop
        /* (12) wopcode 0x11, gt, gt_21      */
gt_21:  // 0x11
        pop
        gt
        0xc0
        // push
        mload
        jump
        stop
        /* (13) wopcode 0x12, slt, slt_21      */
slt_21:  // 0x12
        pop
        slt
        0xc0
        // push
        mload
        jump
        stop
        /* (14) wopcode 0x13, sgt, sgt_21      */
sgt_21:  // 0x13
        pop
        sgt
        0xc0
        // push
        mload
        jump
        stop
        /* (15) wopcode 0x14, eq, eq_21      */
eq_21:  // 0x14
        pop
        eq
        0xc0
        // push
        mload
        jump
        stop
        /* (16) wopcode 0x15, iszero, iszero_11      */
iszero_11:  // 0x15
        pop
        iszero
        0xc0
        // push
        mload
        jump
        stop
        /* (17) wopcode 0x16, and, and_21      */
and_21:  // 0x16
        pop
        and
        0xc0
        // push
        mload
        jump
        stop
        /* (18) wopcode 0x17, or, or_21      */
or_21:  // 0x17
        pop
        or
        0xc0
        // push
        mload
        jump
        stop
        /* (19) wopcode 0x18, xor, xor_21      */
xor_21:  // 0x18
        pop
        xor
        0xc0
        // push
        mload
        jump
        stop
        /* (20) wopcode 0x19, not, not_11      */
not_11:  // 0x19
        pop
        not
        0xc0
        // push
        mload
        jump
        stop
        /* (21) wopcode 0x1a, byte, byte_21      */
byte_21:  // 0x1a
        pop
        byte
        0xc0
        // push
        mload
        jump
        stop
        /* (22) wopcode 0x1b, shl, shl_21      */
shl_21:  // 0x1b
        pop
        shl
        0xc0
        // push
        mload
        jump
        stop
        /* (23) wopcode 0x1c, shr, shr_21      */
shr_21:  // 0x1c
        pop
        shr
        0xc0
        // push
        mload
        jump
        stop
        /* (24) wopcode 0x1d, sar, sar_21      */
sar_21:  // 0x1d
        pop
        sar
        0xc0
        // push
        mload
        jump
        stop
        /* (4) eopcode 0x1e, 5      */
unused_5:  // 0x1e
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (5) eopcode 0x1f, 6      */
unused_6:  // 0x1f
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (25) wopcode 0x20, sha3, sha3_21      */
sha3_21:  // 0x20
        pop
        sha3
        0xc0
        // push
        mload
        jump
        stop
        /* (6) eopcode 0x21, 7      */
unused_7:  // 0x21
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (7) eopcode 0x22, 8      */
unused_8:  // 0x22
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (8) eopcode 0x23, 9      */
unused_9:  // 0x23
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (9) eopcode 0x24, 10      */
unused_10:  // 0x24
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (10) eopcode 0x25, 11      */
unused_11:  // 0x25
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (11) eopcode 0x26, 12      */
unused_12:  // 0x26
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (12) eopcode 0x27, 13      */
unused_13:  // 0x27
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (13) eopcode 0x28, 14      */
unused_14:  // 0x28
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (14) eopcode 0x29, 15      */
unused_15:  // 0x29
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (15) eopcode 0x2a, 16      */
unused_16:  // 0x2a
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (16) eopcode 0x2b, 17      */
unused_17:  // 0x2b
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (17) eopcode 0x2c, 18      */
unused_18:  // 0x2c
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (18) eopcode 0x2d, 19      */
unused_19:  // 0x2d
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (19) eopcode 0x2e, 20      */
unused_20:  // 0x2e
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (20) eopcode 0x2f, 21      */
unused_21:  // 0x2f
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (26) wopcode 0x30, address, address_01      */
address_01:  // 0x30
        pop
        address
        0xc0
        // push
        mload
        jump
        stop
        /* (27) wopcode 0x31, balance, balance_11      */
balance_11:  // 0x31
        pop
        balance
        0xc0
        // push
        mload
        jump
        stop
        /* (28) wopcode 0x32, origin, origin_01      */
origin_01:  // 0x32
        pop
        origin
        0xc0
        // push
        mload
        jump
        stop
        /* (29) wopcode 0x33, caller, caller_01      */
caller_01:  // 0x33
        pop
        caller
        0xc0
        // push
        mload
        jump
        stop
        /* (30) wopcode 0x34, callvalue, callvalue_01      */
callvalue_01:  // 0x34
        pop
        callvalue
        0xc0
        // push
        mload
        jump
        stop
        /* (31) wopcode 0x35, calldataload, calldataload_11      */
calldataload_11:  // 0x35
        pop
        calldataload
        0xc0
        // push
        mload
        jump
        stop
        /* (32) wopcode 0x36, calldatasize, calldatasize_01      */
calldatasize_01:  // 0x36
        pop
        calldatasize
        0xc0
        // push
        mload
        jump
        stop
        /* (33) wopcode 0x37, calldatacopy, calldatacopy_30      */
calldatacopy_30:  // 0x37
        pop
        calldatacopy
        0xc0
        // push
        mload
        jump
        stop
        /* (34) wopcode 0x38, codesize, codesize_01      */
codesize_01:  // 0x38
        pop
        codesize
        0xc0
        // push
        mload
        jump
        stop
        /* (35) wopcode 0x39, codecopy, codecopy_30      */
codecopy_30:  // 0x39
        pop
        codecopy
        0xc0
        // push
        mload
        jump
        stop
        /* (36) wopcode 0x3a, gasprice, gasprice_01      */
gasprice_01:  // 0x3a
        pop
        gasprice
        0xc0
        // push
        mload
        jump
        stop
        /* (37) wopcode 0x3b, extcodesize, extcodesize_11      */
extcodesize_11:  // 0x3b
        pop
        extcodesize
        0xc0
        // push
        mload
        jump
        stop
        /* (38) wopcode 0x3c, extcodecopy, extcodecopy_40      */
extcodecopy_40:  // 0x3c
        pop
        extcodecopy
        0xc0
        // push
        mload
        jump
        stop
        /* (39) wopcode 0x3d, returndatasize, returndatasize_01      */
returndatasize_01:  // 0x3d
        pop
        returndatasize
        0xc0
        // push
        mload
        jump
        stop
        /* (40) wopcode 0x3e, returndatacopy, returndatacopy_30      */
returndatacopy_30:  // 0x3e
        pop
        returndatacopy
        0xc0
        // push
        mload
        jump
        stop
        /* (41) wopcode 0x3f, extcodehash, extcodehash_11      */
extcodehash_11:  // 0x3f
        pop
        extcodehash
        0xc0
        // push
        mload
        jump
        stop
        /* (42) wopcode 0x40, blockhash, blockhash_11      */
blockhash_11:  // 0x40
        pop
        blockhash
        0xc0
        // push
        mload
        jump
        stop
        /* (43) wopcode 0x41, coinbase, coinbase_01      */
coinbase_01:  // 0x41
        pop
        coinbase
        0xc0
        // push
        mload
        jump
        stop
        /* (44) wopcode 0x42, timestamp, timestamp_01      */
timestamp_01:  // 0x42
        pop
        timestamp
        0xc0
        // push
        mload
        jump
        stop
        /* (45) wopcode 0x43, number, number_01      */
number_01:  // 0x43
        pop
        number
        0xc0
        // push
        mload
        jump
        stop
        /* (46) wopcode 0x44, difficulty, difficulty_01      */
difficulty_01:  // 0x44
        pop
        difficulty
        0xc0
        // push
        mload
        jump
        stop
        /* (47) wopcode 0x45, gaslimit, gaslimit_01      */
gaslimit_01:  // 0x45
        pop
        gaslimit
        0xc0
        // push
        mload
        jump
        stop
        /* (48) wopcode 0x46, stop, chainid_01      */
chainid_01:  // 0x46
        pop
        stop
        0xc0
        // push
        mload
        jump
        stop
        /* (49) wopcode 0x47, stop, selfbalance_01      */
selfbalance_01:  // 0x47
        pop
        stop
        0xc0
        // push
        mload
        jump
        stop
        /* (21) eopcode 0x48, 22      */
unused_22:  // 0x48
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (22) eopcode 0x49, 23      */
unused_23:  // 0x49
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (23) eopcode 0x4a, 24      */
unused_24:  // 0x4a
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (24) eopcode 0x4b, 25      */
unused_25:  // 0x4b
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (25) eopcode 0x4c, 26      */
unused_26:  // 0x4c
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (26) eopcode 0x4d, 27      */
unused_27:  // 0x4d
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (27) eopcode 0x4e, 28      */
unused_28:  // 0x4e
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (28) eopcode 0x4f, 29      */
unused_29:  // 0x4f
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (50) wopcode 0x50, pop, pop_00      */
pop_00:  // 0x50
        pop
        pop
        0xc0
        // push
        mload
        jump
        stop
        /* (51) wopcode 0x51, mload, mload_11      */
mload_11:  // 0x51
        pop
        mload
        0xc0
        // push
        mload
        jump
        stop
        /* (52) wopcode 0x52, mstore, mstore_20      */
mstore_20:  // 0x52
        pop
        mstore
        0xc0
        // push
        mload
        jump
        stop
        /* (53) wopcode 0x53, mstore8, mstore8_20      */
mstore8_20:  // 0x53
        pop
        mstore8
        0xc0
        // push
        mload
        jump
        stop
        /* (54) wopcode 0x54, sload, sload_11      */
sload_11:  // 0x54
        pop
        sload
        0xc0
        // push
        mload
        jump
        stop
        /* (55) wopcode 0x55, sstore, sstore_20      */
sstore_20:  // 0x55
        pop
        sstore
        0xc0
        // push
        mload
        jump
        stop
        jump_10:  // 0x56
            pop
            jump_10_extra
            //
            // push2 ?
            jump
            stop
            stop
        jumpi_20:    // 0x57  // cond, new data_ptr, v0 -> dest, v0, cond, jump_10
            jumpi_20_extra
            //
            // push?
            jump
            stop
            stop
            stop
        /* (56) wopcode 0x58, pc, pc_01      */
pc_01:  // 0x58
        pop
        pc
        0xc0
        // push
        mload
        jump
        stop
        /* (57) wopcode 0x59, msize, msize_01      */
msize_01:  // 0x59
        pop
        msize
        0xc0
        // push
        mload
        jump
        stop
        /* (58) wopcode 0x5a, gas, gas_01      */
gas_01:  // 0x5a
        pop
        gas
        0xc0
        // push
        mload
        jump
        stop
        /* (59) wopcode 0x5b, jumpdest, jumpdest_00      */
jumpdest_00:  // 0x5b
        pop
        jumpdest
        0xc0
        // push
        mload
        jump
        stop
        /* (29) eopcode 0x5c, 30      */
unused_30:  // 0x5c
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (30) eopcode 0x5d, 31      */
unused_31:  // 0x5d
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (31) eopcode 0x5e, 32      */
unused_32:  // 0x5e
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (32) eopcode 0x5f, 33      */
unused_33:  // 0x5f
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (0) wopcode_push 0x60, 1      */
push1_01:  // 0x60
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (1) wopcode_push 0x61, 2      */
push2_01:  // 0x61
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (2) wopcode_push 0x62, 3      */
push3_01:  // 0x62
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (3) wopcode_push 0x63, 4      */
push4_01:  // 0x63
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (4) wopcode_push 0x64, 5      */
push5_01:  // 0x64
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (5) wopcode_push 0x65, 6      */
push6_01:  // 0x65
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (6) wopcode_push 0x66, 7      */
push7_01:  // 0x66
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (7) wopcode_push 0x67, 8      */
push8_01:  // 0x67
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (8) wopcode_push 0x68, 9      */
push9_01:  // 0x68
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (9) wopcode_push 0x69, 10      */
push10_01:  // 0x69
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (10) wopcode_push 0x6a, 11      */
push11_01:  // 0x6a
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (11) wopcode_push 0x6b, 12      */
push12_01:  // 0x6b
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (12) wopcode_push 0x6c, 13      */
push13_01:  // 0x6c
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (13) wopcode_push 0x6d, 14      */
push14_01:  // 0x6d
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (14) wopcode_push 0x6e, 15      */
push15_01:  // 0x6e
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (15) wopcode_push 0x6f, 16      */
push16_01:  // 0x6f
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (16) wopcode_push 0x70, 17      */
push17_01:  // 0x70
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (17) wopcode_push 0x71, 18      */
push18_01:  // 0x71
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (18) wopcode_push 0x72, 19      */
push19_01:  // 0x72
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (19) wopcode_push 0x73, 20      */
push20_01:  // 0x73
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (20) wopcode_push 0x74, 21      */
push21_01:  // 0x74
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (21) wopcode_push 0x75, 22      */
push22_01:  // 0x75
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (22) wopcode_push 0x76, 23      */
push23_01:  // 0x76
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (23) wopcode_push 0x77, 24      */
push24_01:  // 0x77
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (24) wopcode_push 0x78, 25      */
push25_01:  // 0x78
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (25) wopcode_push 0x79, 26      */
push26_01:  // 0x79
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (26) wopcode_push 0x7a, 27      */
push27_01:  // 0x7a
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (27) wopcode_push 0x7b, 28      */
push28_01:  // 0x7b
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (28) wopcode_push 0x7c, 29      */
push29_01:  // 0x7c
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (29) wopcode_push 0x7d, 30      */
push30_01:  // 0x7d
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (30) wopcode_push 0x7e, 31      */
push31_01:  // 0x7e
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (31) wopcode_push 0x7f, 32      */
push32_01:  // 0x7f
        0xc0
        // push
        mload
        jump
        stop
        stop
        stop
        /* (0) wopcode_dup 0x80, 1      */
dup1_00:  // 0x80
        pop
        dup1
        0xc0
        // push
        mload
        jump
        stop
        /* (1) wopcode_dup 0x81, 2      */
dup2_00:  // 0x81
        pop
        dup2
        0xc0
        // push
        mload
        jump
        stop
        /* (2) wopcode_dup 0x82, 3      */
dup3_00:  // 0x82
        pop
        dup3
        0xc0
        // push
        mload
        jump
        stop
        /* (3) wopcode_dup 0x83, 4      */
dup4_00:  // 0x83
        pop
        dup4
        0xc0
        // push
        mload
        jump
        stop
        /* (4) wopcode_dup 0x84, 5      */
dup5_00:  // 0x84
        pop
        dup5
        0xc0
        // push
        mload
        jump
        stop
        /* (5) wopcode_dup 0x85, 6      */
dup6_00:  // 0x85
        pop
        dup6
        0xc0
        // push
        mload
        jump
        stop
        /* (6) wopcode_dup 0x86, 7      */
dup7_00:  // 0x86
        pop
        dup7
        0xc0
        // push
        mload
        jump
        stop
        /* (7) wopcode_dup 0x87, 8      */
dup8_00:  // 0x87
        pop
        dup8
        0xc0
        // push
        mload
        jump
        stop
        /* (8) wopcode_dup 0x88, 9      */
dup9_00:  // 0x88
        pop
        dup9
        0xc0
        // push
        mload
        jump
        stop
        /* (9) wopcode_dup 0x89, 10      */
dup10_00:  // 0x89
        pop
        dup10
        0xc0
        // push
        mload
        jump
        stop
        /* (10) wopcode_dup 0x8a, 11      */
dup11_00:  // 0x8a
        pop
        dup11
        0xc0
        // push
        mload
        jump
        stop
        /* (11) wopcode_dup 0x8b, 12      */
dup12_00:  // 0x8b
        pop
        dup12
        0xc0
        // push
        mload
        jump
        stop
        /* (12) wopcode_dup 0x8c, 13      */
dup13_00:  // 0x8c
        pop
        dup13
        0xc0
        // push
        mload
        jump
        stop
        /* (13) wopcode_dup 0x8d, 14      */
dup14_00:  // 0x8d
        pop
        dup14
        0xc0
        // push
        mload
        jump
        stop
        /* (14) wopcode_dup 0x8e, 15      */
dup15_00:  // 0x8e
        pop
        dup15
        0xc0
        // push
        mload
        jump
        stop
        /* (15) wopcode_dup 0x8f, 16      */
dup16_00:  // 0x8f
        pop
        dup16
        0xc0
        // push
        mload
        jump
        stop
        /* (0) wopcode_swap 0x90, 1      */
swap1_00:  // 0x90
        pop
        swap1
        0xc0
        // push
        mload
        jump
        stop
        /* (1) wopcode_swap 0x91, 2      */
swap2_00:  // 0x91
        pop
        swap2
        0xc0
        // push
        mload
        jump
        stop
        /* (2) wopcode_swap 0x92, 3      */
swap3_00:  // 0x92
        pop
        swap3
        0xc0
        // push
        mload
        jump
        stop
        /* (3) wopcode_swap 0x93, 4      */
swap4_00:  // 0x93
        pop
        swap4
        0xc0
        // push
        mload
        jump
        stop
        /* (4) wopcode_swap 0x94, 5      */
swap5_00:  // 0x94
        pop
        swap5
        0xc0
        // push
        mload
        jump
        stop
        /* (5) wopcode_swap 0x95, 6      */
swap6_00:  // 0x95
        pop
        swap6
        0xc0
        // push
        mload
        jump
        stop
        /* (6) wopcode_swap 0x96, 7      */
swap7_00:  // 0x96
        pop
        swap7
        0xc0
        // push
        mload
        jump
        stop
        /* (7) wopcode_swap 0x97, 8      */
swap8_00:  // 0x97
        pop
        swap8
        0xc0
        // push
        mload
        jump
        stop
        /* (8) wopcode_swap 0x98, 9      */
swap9_00:  // 0x98
        pop
        swap9
        0xc0
        // push
        mload
        jump
        stop
        /* (9) wopcode_swap 0x99, 10      */
swap10_00:  // 0x99
        pop
        swap10
        0xc0
        // push
        mload
        jump
        stop
        /* (10) wopcode_swap 0x9a, 11      */
swap11_00:  // 0x9a
        pop
        swap11
        0xc0
        // push
        mload
        jump
        stop
        /* (11) wopcode_swap 0x9b, 12      */
swap12_00:  // 0x9b
        pop
        swap12
        0xc0
        // push
        mload
        jump
        stop
        /* (12) wopcode_swap 0x9c, 13      */
swap13_00:  // 0x9c
        pop
        swap13
        0xc0
        // push
        mload
        jump
        stop
        /* (13) wopcode_swap 0x9d, 14      */
swap14_00:  // 0x9d
        pop
        swap14
        0xc0
        // push
        mload
        jump
        stop
        /* (14) wopcode_swap 0x9e, 15      */
swap15_00:  // 0x9e
        pop
        swap15
        0xc0
        // push
        mload
        jump
        stop
        /* (15) wopcode_swap 0x9f, 16      */
swap16_00:  // 0x9f
        pop
        swap16
        0xc0
        // push
        mload
        jump
        stop
        /* (60) wopcode 0xa0, log0, log0_20      */
log0_20:  // 0xa0
        pop
        log0
        0xc0
        // push
        mload
        jump
        stop
        /* (61) wopcode 0xa1, log1, log1_30      */
log1_30:  // 0xa1
        pop
        log1
        0xc0
        // push
        mload
        jump
        stop
        /* (62) wopcode 0xa2, log2, log2_40      */
log2_40:  // 0xa2
        pop
        log2
        0xc0
        // push
        mload
        jump
        stop
        /* (63) wopcode 0xa3, log3, log3_50      */
log3_50:  // 0xa3
        pop
        log3
        0xc0
        // push
        mload
        jump
        stop
        /* (64) wopcode 0xa4, log4, log4_60      */
log4_60:  // 0xa4
        pop
        log4
        0xc0
        // push
        mload
        jump
        stop
        /* (33) eopcode 0xa5, 34      */
unused_34:  // 0xa5
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (34) eopcode 0xa6, 35      */
unused_35:  // 0xa6
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (35) eopcode 0xa7, 36      */
unused_36:  // 0xa7
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (36) eopcode 0xa8, 37      */
unused_37:  // 0xa8
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (37) eopcode 0xa9, 38      */
unused_38:  // 0xa9
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (38) eopcode 0xaa, 39      */
unused_39:  // 0xaa
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (39) eopcode 0xab, 40      */
unused_40:  // 0xab
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (40) eopcode 0xac, 41      */
unused_41:  // 0xac
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (41) eopcode 0xad, 42      */
unused_42:  // 0xad
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (42) eopcode 0xae, 43      */
unused_43:  // 0xae
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (43) eopcode 0xaf, 44      */
unused_44:  // 0xaf
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (44) eopcode 0xb0, 45      */
unused_45:  // 0xb0
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (45) eopcode 0xb1, 46      */
unused_46:  // 0xb1
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (46) eopcode 0xb2, 47      */
unused_47:  // 0xb2
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (47) eopcode 0xb3, 48      */
unused_48:  // 0xb3
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (48) eopcode 0xb4, 49      */
unused_49:  // 0xb4
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (49) eopcode 0xb5, 50      */
unused_50:  // 0xb5
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (50) eopcode 0xb6, 51      */
unused_51:  // 0xb6
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (51) eopcode 0xb7, 52      */
unused_52:  // 0xb7
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (52) eopcode 0xb8, 53      */
unused_53:  // 0xb8
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (53) eopcode 0xb9, 54      */
unused_54:  // 0xb9
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (54) eopcode 0xba, 55      */
unused_55:  // 0xba
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (55) eopcode 0xbb, 56      */
unused_56:  // 0xbb
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (56) eopcode 0xbc, 57      */
unused_57:  // 0xbc
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (57) eopcode 0xbd, 58      */
unused_58:  // 0xbd
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (58) eopcode 0xbe, 59      */
unused_59:  // 0xbe
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (59) eopcode 0xbf, 60      */
unused_60:  // 0xbf
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (60) eopcode 0xc0, 61      */
unused_61:  // 0xc0
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        log_2_11:  // 0xc1
            pop
            log_2_11_extra
            //
            // push
            jump
            stop
            stop
        log_11:  // 0xc2 // TODO fixme
            pop
            log_11_extra
            //
            // push
            jump
            stop
            stop
        sqrt_11:  // 0xc3
            pop
            sqrt_11_extra
            //
            // push
            jump
            stop
            stop
        nthroot_31:  // 0xc4
            pop
            nthroot_31_extra
            //
            // push
            jump
            stop
            stop
        factorial_11:  // 0xc5
            pop
            factorial_11_extra
            //
            // push
            jump
            stop
            stop
        /* (61) eopcode 0xc6, 62      */
unused_62:  // 0xc6
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (62) eopcode 0xc7, 63      */
unused_63:  // 0xc7
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (63) eopcode 0xc8, 64      */
unused_64:  // 0xc8
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (64) eopcode 0xc9, 65      */
unused_65:  // 0xc9
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (65) eopcode 0xca, 66      */
unused_66:  // 0xca
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (66) eopcode 0xcb, 67      */
unused_67:  // 0xcb
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (67) eopcode 0xcc, 68      */
unused_68:  // 0xcc
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (68) eopcode 0xcd, 69      */
unused_69:  // 0xcd
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (69) eopcode 0xce, 70      */
unused_70:  // 0xce
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (70) eopcode 0xcf, 71      */
unused_71:  // 0xcf
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (71) eopcode 0xd0, 72      */
unused_72:  // 0xd0
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (72) eopcode 0xd1, 73      */
unused_73:  // 0xd1
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (73) eopcode 0xd2, 74      */
unused_74:  // 0xd2
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (74) eopcode 0xd3, 75      */
unused_75:  // 0xd3
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (75) eopcode 0xd4, 76      */
unused_76:  // 0xd4
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (76) eopcode 0xd5, 77      */
unused_77:  // 0xd5
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (77) eopcode 0xd6, 78      */
unused_78:  // 0xd6
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (78) eopcode 0xd7, 79      */
unused_79:  // 0xd7
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (79) eopcode 0xd8, 80      */
unused_80:  // 0xd8
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (80) eopcode 0xd9, 81      */
unused_81:  // 0xd9
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (81) eopcode 0xda, 82      */
unused_82:  // 0xda
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (82) eopcode 0xdb, 83      */
unused_83:  // 0xdb
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (83) eopcode 0xdc, 84      */
unused_84:  // 0xdc
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (84) eopcode 0xdd, 85      */
unused_85:  // 0xdd
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (85) eopcode 0xde, 86      */
unused_86:  // 0xde
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (86) eopcode 0xdf, 87      */
unused_87:  // 0xdf
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (87) eopcode 0xe0, 88      */
unused_88:  // 0xe0
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (88) eopcode 0xe1, 89      */
unused_89:  // 0xe1
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (89) eopcode 0xe2, 90      */
unused_90:  // 0xe2
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (90) eopcode 0xe3, 91      */
unused_91:  // 0xe3
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (91) eopcode 0xe4, 92      */
unused_92:  // 0xe4
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (92) eopcode 0xe5, 93      */
unused_93:  // 0xe5
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (93) eopcode 0xe6, 94      */
unused_94:  // 0xe6
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (94) eopcode 0xe7, 95      */
unused_95:  // 0xe7
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (95) eopcode 0xe8, 96      */
unused_96:  // 0xe8
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (96) eopcode 0xe9, 97      */
unused_97:  // 0xe9
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (97) eopcode 0xea, 98      */
unused_98:  // 0xea
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (98) eopcode 0xeb, 99      */
unused_99:  // 0xeb
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (99) eopcode 0xec, 100      */
unused_100:  // 0xec
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (100) eopcode 0xed, 101      */
unused_101:  // 0xed
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (101) eopcode 0xee, 102      */
unused_102:  // 0xee
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (102) eopcode 0xef, 103      */
unused_103:  // 0xef
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (65) wopcode 0xf0, create, create_31      */
create_31:  // 0xf0
        pop
        create
        0xc0
        // push
        mload
        jump
        stop
        /* (66) wopcode 0xf1, call, call_71      */
call_71:  // 0xf1
        pop
        call
        0xc0
        // push
        mload
        jump
        stop
        /* (67) wopcode 0xf2, callcode, callcode_71      */
callcode_71:  // 0xf2
        pop
        callcode
        0xc0
        // push
        mload
        jump
        stop
        /* (68) wopcode 0xf3, return, return_20      */
return_20:  // 0xf3
        pop
        return
        0xc0
        // push
        mload
        jump
        stop
        /* (69) wopcode 0xf4, delegatecall, delegatecall_61      */
delegatecall_61:  // 0xf4
        pop
        delegatecall
        0xc0
        // push
        mload
        jump
        stop
        /* (70) wopcode 0xf5, create2, create2_41      */
create2_41:  // 0xf5
        pop
        create2
        0xc0
        // push
        mload
        jump
        stop
        /* (103) eopcode 0xf6, 104      */
unused_104:  // 0xf6
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (104) eopcode 0xf7, 105      */
unused_105:  // 0xf7
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (105) eopcode 0xf8, 106      */
unused_106:  // 0xf8
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (106) eopcode 0xf9, 107      */
unused_107:  // 0xf9
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (71) wopcode 0xfa, staticcall, staticcall_61      */
staticcall_61:  // 0xfa
        pop
        staticcall
        0xc0
        // push
        mload
        jump
        stop
        /* (107) eopcode 0xfb, 108      */
unused_108:  // 0xfb
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (108) eopcode 0xfc, 109      */
unused_109:  // 0xfc
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (72) wopcode 0xfd, revert, revert_20      */
revert_20:  // 0xfd
        pop
        revert
        0xc0
        // push
        mload
        jump
        stop
        /* (109) eopcode 0xfe, 110      */
unused_110:  // 0xfe
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (73) wopcode 0xff, selfdestruct, selfdestruct_10      */
selfdestruct_10:  // 0xff
        pop
        selfdestruct
        0xc0
        // push
        mload
        jump
        stop
        allocate_11: // 0x100
            allocate_11_extra
            //
            // push
            jump
            stop
            stop
            stop
        return_10: // 0x101
            pop
            return_10_extra
            //
            // push
            jump
            stop
            stop
        mmultimstore_30: // 0x102
            pop
            mmultimstore_30_extra
            //
            // push
            jump
            stop
            stop
        unknown_11:   // 0x103
            pop
            unknown_11_extra
            //
            // push
            jump
            stop
            stop
        lambda_xx:  // 0x104
            stop
            stop
            stop
            stop
            stop
            stop
            stop
        apply_xx:   // 0x105
            pop
            apply_xx_extra
            //
            // push
            jump
            stop
            stop
        setfn_10:   // 0x106
            pop
            setfn_10_extra
            //
            // push
            jump
            stop
            stop
        getfn_11:   // 0x107
            pop
            getfn_11_extra
            //
            // push
            jump
            stop
            stop
        setalias_20:   // 0x108  // name pointer
            pop
            setalias_20_extra
            //
            // push
            jump
            stop
            stop
        getalias_11:   // 0x109  // name pointer -> signature
            pop
            getalias_11_extra
            //
            // push
            jump
            stop
            stop
        if_3x:   // 0x10a  // branch2_ptr, branch1_ptr, cond
            pop
            if_3x_extra
            //
            // push
            jump
            stop
            stop
        self_0x:  // 0x10b
            pop
            self_0x_extra
            //
            // push
            jump
            stop
            stop
        super_1x:  // 0x10c
            pop
            super_1x_extra
            //
            // push
            jump
            stop
            stop
        /* (110) eopcode 0x10d, 111      */
unused_111:  // 0x10d
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (111) eopcode 0x10e, 112      */
unused_112:  // 0x10e
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (112) eopcode 0x10f, 113      */
unused_113:  // 0x10f
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (113) eopcode 0x110, 114      */
unused_114:  // 0x110
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (114) eopcode 0x111, 115      */
unused_115:  // 0x111
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (115) eopcode 0x112, 116      */
unused_116:  // 0x112
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (116) eopcode 0x113, 117      */
unused_117:  // 0x113
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (117) eopcode 0x114, 118      */
unused_118:  // 0x114
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (118) eopcode 0x115, 119      */
unused_119:  // 0x115
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (119) eopcode 0x116, 120      */
unused_120:  // 0x116
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (120) eopcode 0x117, 121      */
unused_121:  // 0x117
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (121) eopcode 0x118, 122      */
unused_122:  // 0x118
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (122) eopcode 0x119, 123      */
unused_123:  // 0x119
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (123) eopcode 0x11a, 124      */
unused_124:  // 0x11a
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (124) eopcode 0x11b, 125      */
unused_125:  // 0x11b
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (125) eopcode 0x11c, 126      */
unused_126:  // 0x11c
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (126) eopcode 0x11d, 127      */
unused_127:  // 0x11d
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (127) eopcode 0x11e, 128      */
unused_128:  // 0x11e
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        /* (128) eopcode 0x11f, 129      */
unused_129:  // 0x11f
        stop
        stop
        stop
        stop
        stop
        stop
        stop
        calldatacopy__21:     // 0x120
            pop
            calldatacopy__21_extra
            //
            // push
            jump
            stop
            stop
        codecopy__21:     // 0x121
            pop
            codecopy__21_extra
            //
            // push
            jump
            stop
            stop
        extcodecopy__31:     // 0x122
            pop
            extcodecopy__31_extra
            //
            // push
            jump
            stop
            stop
        returndatacopy__21:     // 0x123
            pop
            returndatacopy__21_extra
            //
            // push
            jump
            stop
            stop
        revert_10:     // 0x124
            pop
            revert_10_extra
            //
            // push
            jump
            stop
            stop
        keccak256_11:     // 0x125
            pop
            keccak256_11_extra
            //
            // push
            jump
            stop
            stop
        jump_10_extra:
            0xe0        // start of data data_ptr
            // push1
            add
            0x80          // store new data_ptr
            // push
            mstore
            0xc0
            // push
            mload
            jump
        jumpi_20_extra:
            swap1    // cond, v0, dest
            swap2    // dest, v0, cond
            jump_10
            // push
            jumpi
            pop
            pop
            0xc0
            // push
            mload
            jump
        log_2_11_extra:
            not(0x00)
            dup2
            add
            0x02
            dup2
            div
            dup2
            or
            swap1
            pop
            0x04
            dup2
            div
            dup2
            or
            swap1
            pop
            0x10
            dup2
            div
            dup2
            or
            swap1
            pop
            0x0100
            dup1
            dup3
            div
            dup3
            or
            swap2
            pop
            0x010000
            dup3
            div
            dup3
            or
            swap2
            pop
            0x0100000000
            dup3
            div
            dup3
            or
            swap2
            pop
            0x010000000000000000
            dup3
            div
            dup3
            or
            swap2
            pop
            0x40
            mload
            0xf8f9cbfae6cc78fbefe7cdc3a1793dfcf4f0e8bbd8cec470b6a28a7a5a3e1efd
            dup2
            mstore
            0xf5ecf1b3e9debc68e1d9cfabc5997135bfb7a7a3938b7b606b5b4b3f2f1f0ffe
            0x20
            dup3
            add
            mstore
            0xf6e4ed9ff2d6b458eadcdf97bd91692de2d4da8fd2d0ac50c6ae9a8272523616
            0x40
            dup3
            add
            mstore
            0xc8c0b887b0a8a4489c948c7f847c6125746c645c544c444038302820181008ff
            0x60
            dup3
            add
            mstore
            0xf7cae577eec2a03cf3bad76fb589591debb2dd67e0aa9834bea6925f6a4a2e0e
            0x80
            dup3
            add
            mstore
            0xe39ed557db96902cd38ed14fad815115c786af479b7e83247363534337271707
            0xa0
            dup3
            add
            mstore
            0xc976c13bb96e881cb166a933a55e490d9d56952b8d4e801485467d2362422606
            0xc0
            dup3
            add
            mstore
            0x753a6d1b65325d0c552a4d1345224105391a310b29122104190a110309020100
            0xe0
            dup3
            add
            mstore
            dup2
            dup2
            add
            0x40
            mstore
            0x01
            0xf8
            shl
            dup1
            dup2
            0x818283848586878898a8b8c8d8e8f929395969799a9b9d9e9faaeb6bedeeff
            0x01
            0x01
            0x80
            shl
            dup9
            div
            dup9
            or
            add
            mul
            div
            0xff
            sub
            dup4
            add
            mload
            div
            swap4
            pop
            pop
            pop
            0x01
            0xff
            shl
            dup4
            gt
            dup2
            mul
            dup3
            add
            swap3
            pop
            pop
            pop
            0xc0
            // push
            mload
            jump
        log_11_extra:
            0xc0
            mload
            0x60
            mstore
            log_11_extra_2
            0xc0
            mstore
            log_2_11_extra  // log2(base)
            jump
        log_11_extra_2:
            log_11_extra_3
            0xc0
            mstore
            swap1
            log_2_11_extra  // log2(x)
            jump
        log_11_extra_3:
            div      // log2(x)/log2(base)
            0x60
            mload
            dup1
            0xc0
            mstore
            jump
        sqrt_11_extra:
            0x02
            dup1
            0x01
            dup4
            add
            div
            dup3
        sqrt_11_extra_loop:
              dup1
              dup3
              lt
              iszero
              sqrt_11_extra_loop3
              jumpi
              dup2
              swap1
              pop
              dup3
              dup3
              dup4
              dup7
              div
              add
              div
              swap2
              pop
        sqrt_11_extra_loop2:
            jump(sqrt_11_extra_loop)
        sqrt_11_extra_loop3:
            pop
            dup1
            swap3
            pop
            pop
            pop
            0xc0
            // push
            mload
            jump
        nthroot_31_extra:
            dup1
              0x0a
              exp
              dup3
              mul
              0x0a
              0x00
              not(0x00)
              dup5
              add
            nthroot_31_extra1:
              dup2
              dup4
              eq
              iszero
              iszero
              nthroot_31_extra3
              jumpi
              dup3
              dup4
              swap3
              pop
              dup2
              dup5
              exp
              dup6
              dup2
              dup7
              mul
              gt
              0x01
              dup2
              eq
              nthroot_31_extra5
              jumpi
              dup8
              dup4
              dup4
              dup10
              div
              sub
              div
              dup4
              add
              swap6
              pop
              jump(nthroot_31_extra4)
            nthroot_31_extra5:
              dup8
              dup3
              dup9
              div
              dup8
              sub
              div
              dup7
              sub
              swap6
              pop
            nthroot_31_extra4:
              pop
              pop
              pop
            nthroot_31_extra2:
              jump(nthroot_31_extra1)
            nthroot_31_extra3:
              pop
              pop
              0x0a
              0x05
              dup3
              add
              div
            swap3
            pop
            pop
            pop
            swap1
            pop
            0xc0
            // push
            mload
            jump
        factorial_11_extra:
            dup1
        factorial_11_extra_1:
            0x02
            dup2
            lt
            factorial_11_extra_return
            jumpi
            0x01
            swap1
            sub
            swap1
            dup2
            mul
            swap1
            factorial_11_extra_1
            jump
        factorial_11_extra_return:
            pop
            0xc0
            // push
            mload
            jump
        allocate_11_extra:
            /* (3) allocate 0x40      */
0x40
    mload
    swap1
    dup2
    add
    0x40
    mstore
            0xc0
            // push
            mload
            jump
        mmultimstore_30_extra:
            /* (1) mmultimstore //   //   */
// alloc before using it
            // size_bytes, source_ptr, target_ptr
            dup3   // size_bytes

            // calc slots
            0x20
            dup2
            div

            0x00
            0x20
            dup4
            mod
            gt
            add

            swap1
            pop

            // end calc slots

            swap3            // slots, source_ptr, target_ptr ; replace length with slots
            pop

            mmultimstore_end_1
            dup4             // slots
            0x00

for_stack_4:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_4
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_4:   // any content variables are kept after jumptag, end, step

                // slots, source_ptr, target_ptr, tag, end, step
                dup5
                mload
                dup5
                mstore

                dup5
                0x20
                add
                swap5
                pop

                dup4
                0x20
                add
                swap4
                pop

    forloop_end_stack_4:
        0x01   // start/step first
        add
        for_stack_4
        jump
        mmultimstore_end_1:
            pop
            pop
            pop
        unknown_11_extra:
            /* (11) getframe //  frame_ptr   //  frame_ptr   */
0xe0
            mload
            dup1        //  frame_ptr, frame_ptr
            /* (6) getdataptr //  frame_ptr, data_ptr   //  frame_ptr, data_ptr   */
0x20
            add
            mload
            /* (4) getfourb //  frame_ptr, fourb   //  frame_ptr, fourb   */
// expects a pointer
            mload
            0xe0
            shr

            dup1        //  frame_ptr, fourb, fourb
            /* (0) getfunclength // frame_ptr, fourb, length   // frame_ptr, fourb, length   */
// expects a 4byte value
            0xfffc00
            and
            0x0a
            shr

            swap1       // frame_ptr, length, fourb
            /* (1) getfuncarity // frame_ptr, length, arity // frame_ptr, index, superIndex   // frame_ptr, length, arity // frame_ptr, index, superIndex   */
// expects a 4byte value
            0x3f
            and

            dup3        // frame_ptr, index, superIndex, frame_ptr
            swap1       // frame_ptr, index, frame_ptr, superIndex
            /* (0) getsuperenv // frame_ptr, index, env_ptr   // frame_ptr, index, env_ptr   */
// frame_ptr, index
            getsuperenv_0  // frame_ptr, index, tag
            swap1                  // frame_ptr, tag, index
            0x00

for_stack_5:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_5
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_5:   // any content variables are kept after jumptag, end, step

                // frame_ptr, tag, end, step
                dup4
                mload    // prev_frame_ptr
                swap4
                pop     // replace with prev_frame_ptr

    forloop_end_stack_5:
        0x01   // start/step first
        add
        for_stack_5
        jump
            getsuperenv_0:
                // last frame_ptr

                0x40   // get ptr env
                add
                mload

            0x40     // after arity and self
            add      // frame_ptr, index, env_ptr
            dup2   // frame_ptr, index, env_ptr, index
            0x20
            mul
            add    // frame_ptr, index, env_ptr
            mload  // load env value

            swap1   // pop index
            pop
            swap1
            pop    // pop frame_ptr

            0xc0
            // push
            mload
            jump
        apply_xx_extra: // args, lambda_ptr__
            dup1  // args, lambda_ptr__, lambda_ptr__
            0x20
            add   // after length lambda_ptr // args, lambda_ptr__, lambda_ptr, lambda_ptr
            dup1     // load lambda head todo: require id is lambda id
            /* (5) getfourb // args, lambda_ptr__, lambda_ptr, 4b   // args, lambda_ptr__, lambda_ptr, 4b   */
// expects a pointer
            mload
            0xe0
            shr

            /* (2) getfuncarity // lambda arity // args, lambda_ptr__, lambda_ptr, lambda_arity   // lambda arity // args, lambda_ptr__, lambda_ptr, lambda_arity   */
// expects a 4byte value
            0x3f
            and

            // move lambda pointer to lambda body
            swap1   // args, lambda_ptr__, lambda_arity, lambda_ptr
            0x08
            add     // lambda sig
            dup2
            0x02
            mul     // unknowns offset
            add     // move lambda ptr at body

            swap1   // args, lambda_ptr__, lambda_ptr, lambda_arity

            // create new memory frame with new env
            // TODO meld new env with old env

            dup1             // args, lambda_ptr__, lambda_ptr, lambda_arity, lambda_arity
            0x01
            add              // self
            /* (0) t22_init_ 0x40   // args, lambda_ptr__, lambda_ptr, lambda_arity, new_env_ptr   // args, lambda_ptr__, lambda_ptr, lambda_arity, new_env_ptr   */
// expects arity // 0x40   // args = freeMemPtr
    dup1
    0x20
    mul
    0x20
    add

    // alloc 0x40   // args    // freeMemPtr
    0x40   // args
    mload
    swap1
    dup2
    add
    0x40   // args
    mstore

    swap1       // store arity first
    dup2
    mstore

            // storing reference to self
            swap1   // args, lambda_ptr__, lambda_ptr, new_env_ptr, lambda_arity
            swap2   // args, lambda_ptr__, lambda_arity, new_env_ptr, lambda_ptr
            swap3   // args, lambda_ptr, lambda_arity, new_env_ptr, lambda_ptr__
            dup2    // args, lambda_ptr, lambda_arity, new_env_ptr, lambda_ptr__, new_env_ptr
            0x20
            add
            mstore  // args, lambda_ptr, lambda_arity, new_env_ptr

            dup1
            0x40
            add    // current_env_ptr

            swap1
            swap2

            apply_xx_extra_mfor_end    // args, lambda_ptr, lambda_arity, new_env_ptr, current_env_ptr
            swap1  // args, lambda_ptr, new_env_ptr, current_env_ptr, tag, lambda_arity
            0x00

for_stack_6:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_6
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_6:   // any content variables are kept after jumptag, end, step

                // args, lambda_ptr, new_env_ptr, current_env_ptr, tag, end, step

                // load env_ptr and write args
                // call eval with lambda pointer and return back here

                dup7   // first arg
                dup5   // current_env_ptr
                mstore

                dup4   // current_env_ptr increase
                0x20
                add
                swap4
                pop

                swap1
                swap2
                swap3
                swap4
                swap5
                swap6
                pop

    forloop_end_stack_6:
        0x01   // start/step first
        add
        for_stack_6
        jump

        apply_xx_extra_mfor_end:
            // lambda_ptr, new_env_ptr, current_env_ptr
            pop  // lambda_ptr, new_env_ptr

            // MEMORY FRAME INIT  //
            0x160
            /* (4) allocate 0x40  // lambda_ptr, new_env_ptr, new_frame_ptr   // lambda_ptr, new_env_ptr, new_frame_ptr   */
0x40  // lambda_ptr
    mload
    swap1
    dup2
    add
    0x40  // lambda_ptr
    mstore

            /* (12) getframe // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr   // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr   */
0xe0
            mload
            dup1   // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr, prev_frame_ptr
            dup3   // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr, prev_frame_ptr, new_frame_ptr
            mstore  // PREV_PTR(0)  // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr

            // store current_frame_ptr
            dup2
            0xe0
            mstore

            dup1     // get mem/stack location from parent
            /* (4) getloco // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr, mem/stack   // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr, mem/stack   */
0x60
            add
            mload
            dup3     // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr, mem/stack, new_frame_ptr
            /* (2) setloco // MEM/STACK(3) //   if next is a function, it will set the mem/stack location itself   // MEM/STACK(3) //   if next is a function, it will set the mem/stack location itself   */
0x60
            add
            mstore

            // lambda_ptr, new_env_ptr, new_frame_ptr, prev_frame_ptr
            /* (2) getoutputptr // lambda_ptr, new_env_ptr, new_frame_ptr, output_ptr   // lambda_ptr, new_env_ptr, new_frame_ptr, output_ptr   */
0xa0
            add
            mload
            dup2         // lambda_ptr, new_env_ptr, new_frame_ptr, output_ptr, new_frame_ptr
            /* (1) setoutputptr // lambda_ptr, new_env_ptr, new_frame_ptr   // lambda_ptr, new_env_ptr, new_frame_ptr   */
0xa0
            add
            mstore

            // pop  // lambda_ptr, new_env_ptr, new_frame_ptr

            swap1  // lambda_ptr, new_frame_ptr, new_env_ptr
            dup2
            /* (1) setenvptr // lambda_ptr, new_frame_ptr   // lambda_ptr, new_frame_ptr   */
0x40
            add
            mstore

            swap1      // new_frame_ptr, lambda_ptr
            dup2       // new_frame_ptr, lambda_ptr, new_frame_ptr
            /* (2) setdataptr // new_frame_ptr   // new_frame_ptr   */
0x20
            add
            mstore

            apply_xx_extra_eval_end    // return tag
            swap1
            /* (2) setreturn //   //   */
0x120
            add
            mstore
            tag_eval
            jump

        apply_xx_extra_eval_end:
            /* (13) getframe //   //   */
0xe0
            mload
            /* (5) getloco //   //   */
0x60
            add
            mload
            iszero   // jump if stack
            apply_xx_extra_eval_end_both
            jumpi

            // mem - put result on stack
            /* (14) getframe //   //   */
0xe0
            mload
            /* (3) getoutputptr //   //   */
0xa0
            add
            mload

            mload   // output_ptr - arity
            0x40    // result_ptr ; end_ptr is at 0x20
            add
            mload
        apply_xx_extra_eval_end_both:
            // previous frame
            /* (15) getframe //   //   */
0xe0
            mload
            mload     // get previous frame
            0xe0
            mstore

            0xc0
            // push
            mload
            jump
        setfn_10_extra:  // pointer to lambda - length & lambda
            // TODO: build sig, set correct arity
            0x3400100000000000000000000000000000000000000000000000000000000000
            /* (0) getfncounter //   //   */
0x01
            sload
            add
            swap1  // fsig, ptr

            dup2  // fsig, ptr, fsig
            dup2  // fsig, ptr, fsig, ptr

            mload  // fsig, ptr, fsig, length
            0x20
            add    // save with length
            swap2  // fsig, length, fsig, ptr
            swap1  // fsig, length, ptr, fsig

            /* (0) getfnkey // fsig, length, ptr, key   // fsig, length, ptr, key   */
// expects fsig
            0x02    // seed
            0x00
            mstore

            0x20
            mstore

            0x40
            0x00
            sha3
            /* (0) mmultisstore // fsig   // fsig   */
// alloc before using it
            // size_bytes, source_ptr, key
            dup3   // size_bytes

            // calc slots
            0x20
            dup2
            div

            0x00
            0x20
            dup4
            mod
            gt
            add

            swap1
            pop

            // end calc slots

            swap3            // slots, source_ptr, key ; replace length with slots
            pop

            swap1
            swap2     // source_ptr, key, slots

            mmultisstore_end_0
            swap1             // source_ptr, key, tag, slots/end
            0x00

for_stack_7:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_7
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_7:   // any content variables are kept after jumptag, end, step

                // source_ptr, key, tag, end, step

                dup5
                mload
                dup5
                sstore

                dup5
                0x20
                add
                swap5
                pop

                dup4
                0x01
                add
                swap4
                pop

    forloop_end_stack_7:
        0x01   // start/step first
        add
        for_stack_7
        jump
        mmultisstore_end_0:
            pop
            pop

            /* (0) addfncounter //   //   */
0x01
            sload
            0x01
            add
            0x01
            sstore

            0xc0
            // push
            mload
            jump
        getfn_11_extra:  // fsig pointer -> pointer
            0x20
            add
            mload

            0xfffffbffffffffffffffffffffffffffffffffffffffffffffffffffffffffff    // mem/stack -> 0
            and

            /* (1) getfnkey //  key   //  key   */
// expects fsig
            0x02    // seed
            0x00
            mstore

            0x20
            mstore

            0x40
            0x00
            sha3
            /* (0) mmultisload 0x40  //  ptr   //  ptr   */
// alloc before using it
            // key
            dup1  // key, key

            dup1
            0x01
            add   // key, key, key2
            swap2
            pop  // key2, key

            sload  // key2, length
            dup1  // key2, length, length
            0x20
            add   // account for length

            // alloc
            0x40  //  ptr
            mload
            swap1
            dup2
            add
            0x40  //  ptr
            mstore
            // alloc - end

            // key2, length, target_ptr

            // save length at ptr
            dup2
            dup2
            mstore  // key2, length, target_ptr

            dup1     // key2, length, target_ptr, target_ptr
            0x20
            add     // key2, length, target_ptr, current_target_ptr
            swap1   // key2, length, current_target_ptr, target_ptr
            swap3    // target_ptr, length, current_target_ptr, key2
            swap2    // target_ptr, key2, current_target_ptr, length

            // calc slots
            0x20
            dup2
            div

            0x00
            0x20
            dup4
            mod
            gt
            add

            swap1
            pop

            // end calc slots

            // target_ptr, key2, current_target_ptr, slots
            swap2 // target_ptr, slots, current_target_ptr, key2

            mmultisload_end_0
            dup4             // slots
            0x00

for_stack_8:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_8
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_8:   // any content variables are kept after jumptag, end, step

                // target_ptr, slots, target_ptr, key2, tag, end, step
                dup4
                sload   // target_ptr, slots, current_target_ptr, key2, tag, end, step, value
                dup6    // target_ptr, slots, current_target_ptr, key2, tag, end, step, value, current_target_ptr
                mstore  // target_ptr, slots, current_target_ptr, key2, tag, end, step

                dup5
                0x20
                add
                swap5
                pop

                dup4
                0x01
                add
                swap4
                pop

    forloop_end_stack_8:
        0x01   // start/step first
        add
        for_stack_8
        jump
        mmultisload_end_0:
            pop
            pop
            pop   // leave target_ptr on stack

            0xc0
            // push
            mload
            jump
        setalias_20_extra:  // name pointer, signature ptr TODO might be > 32 bytes save with length
            // sig, name_ptr
            /* (0) getnamehash // sig, key   // sig, key   */
// expects pointer to name (bytes)

            0x03    // seed
            0x00
            mstore

            // hash name first, so we don't need to copy the bytes
            dup1
            mload   // length
            swap1   // length, ptr
            sha3

            0x20
            mstore

            0x40
            0x00
            sha3
            sstore
            0x01           // add a success result on stack
            0xc0
            // push
            mload
            jump
        getalias_11_extra:  // name pointer -> signature pointer
            /* (1) getnamehash //   //   */
// expects pointer to name (bytes)

            0x03    // seed
            0x00
            mstore

            // hash name first, so we don't need to copy the bytes
            dup1
            mload   // length
            swap1   // length, ptr
            sha3

            0x20
            mstore

            0x40
            0x00
            sha3
            sload        // load signature

            0x20          // TODO multi slots
            /* (0) t2_init__ 0x40      */
// expects length // 0x40 = freeMemPtr
    dup1
    0x20
    add           // length, fulllength

    // alloc 0x40    // freeMemPtr
    0x40
    mload
    swap1
    dup2
    add
    0x40
    mstore     // length, ptr

    dup1       // store length   // length, ptr, ptr
    swap2      // ptr, ptr, length
    swap1      // ptr, length, ptr
    mstore     // ptr
            dup1      // sig, sig_ptr, sig_ptr
            swap2    // sig_ptr, sig_ptr, sig
            swap1    // sig_ptr, sig, sig_ptr

            /* (0) t2_ptr_ //   //   */
// expects t2 pointer
    0x20
    add
            mstore    // sig_ptr

            0xc0
            // push
            mload
            jump
        if_3x_extra:   // 0x10a  // branch2_ptr, branch1_ptr, cond
            iszero
            if_3x_branch2
            jumpi
            swap1
            pop     // remove branch2_ptr

            /* (1) t2_ptr_ // get actual pointer   // get actual pointer   */
// expects t2 pointer
    0x20
    add
            /* (16) getframe // branch1_ptr, frame_ptr   // branch1_ptr, frame_ptr   */
0xe0
            mload
            /* (3) setdataptr //   //   */
0x20
            add
            mstore

            tag_eval
            jump
        if_3x_branch2:
            pop    // remove branch1_ptr

            /* (2) t2_ptr_ // get actual pointer   // get actual pointer   */
// expects t2 pointer
    0x20
    add
            /* (17) getframe // branch2_ptr, frame_ptr   // branch2_ptr, frame_ptr   */
0xe0
            mload
            /* (4) setdataptr //   //   */
0x20
            add
            mstore

            tag_eval
            jump
        self_0x_extra:
            /* (18) getframe //   //   */
0xe0
            mload
            /* (1) getenvptr //   //   */
0x40
            add
            mload
            0x20
            add       // args, lambda_ptr
            mload
            apply_xx_extra
            jump
        super_1x_extra:
            // index
            /* (19) getframe //   //   */
0xe0
            mload
            swap1     // frame_ptr, super index

            /* (1) getsuperenv //   //   */
// frame_ptr, index
            getsuperenv_1  // frame_ptr, index, tag
            swap1                  // frame_ptr, tag, index
            0x00

for_stack_9:
        dup2   // end
        dup2   // start
        lt
        forloop_stack_9
        jumpi
        pop    // pop end, step
        pop
        jump
    forloop_stack_9:   // any content variables are kept after jumptag, end, step

                // frame_ptr, tag, end, step
                dup4
                mload    // prev_frame_ptr
                swap4
                pop     // replace with prev_frame_ptr

    forloop_end_stack_9:
        0x01   // start/step first
        add
        for_stack_9
        jump
            getsuperenv_1:
                // last frame_ptr

                0x40   // get ptr env
                add
                mload

            0x20
            add       // args, lambda_ptr
            mload
            apply_xx_extra
            jump
        return_10_extra:
            dup1   // pointer
            mload  // length
            swap1
            0x20
            add
            return
        revert_10_extra:
            dup1   // pointer
            mload  // length
            swap1
            0x20
            add
            revert
        calldatacopy__21_extra:
                              // calld_length, calld_start
            dup2              // calld_length, calld_start, calld_length
            /* (1) t2_init__ 0x40    // calld_length, calld_start, mem_ptr__   // calld_length, calld_start, mem_ptr__   */
// expects length // 0x40    // calld_length = freeMemPtr
    dup1
    0x20
    add           // length, fulllength

    // alloc 0x40    // calld_length    // freeMemPtr
    0x40    // calld_length
    mload
    swap1
    dup2
    add
    0x40    // calld_length
    mstore     // length, ptr

    dup1       // store length   // length, ptr, ptr
    swap2      // ptr, ptr, length
    swap1      // ptr, length, ptr
    mstore     // ptr
            swap2             // mem_ptr__, calld_start, calld_length
            swap1             // mem_ptr__, calld_length, calld_start
            dup3
            /* (3) t2_ptr_ // mem_ptr__, calld_length, calld_start, ptr   // mem_ptr__, calld_length, calld_start, ptr   */
// expects t2 pointer
    0x20
    add
            calldatacopy      // mem_ptr__
            0xc0
            // push
            mload
            jump
        codecopy__21_extra:
                              // calld_length, calld_start
            dup2              // calld_length, calld_start, calld_length
            /* (2) t2_init__ 0x40    // calld_length, calld_start, mem_ptr__   // calld_length, calld_start, mem_ptr__   */
// expects length // 0x40    // calld_length = freeMemPtr
    dup1
    0x20
    add           // length, fulllength

    // alloc 0x40    // calld_length    // freeMemPtr
    0x40    // calld_length
    mload
    swap1
    dup2
    add
    0x40    // calld_length
    mstore     // length, ptr

    dup1       // store length   // length, ptr, ptr
    swap2      // ptr, ptr, length
    swap1      // ptr, length, ptr
    mstore     // ptr
            swap2             // mem_ptr__, calld_start, calld_length
            swap1             // mem_ptr__, calld_length, calld_start
            dup3
            /* (4) t2_ptr_ // mem_ptr__, calld_length, calld_start, ptr   // mem_ptr__, calld_length, calld_start, ptr   */
// expects t2 pointer
    0x20
    add
            codecopy          // mem_ptr__
            0xc0
            // push
            mload
            jump
        extcodecopy__31_extra:
                              // calld_length, calld_start, address
            dup3              // calld_length, calld_start, address, calld_length
            /* (3) t2_init__ 0x40    // calld_length, calld_start, address, mem_ptr__   // calld_length, calld_start, address, mem_ptr__   */
// expects length // 0x40    // calld_length = freeMemPtr
    dup1
    0x20
    add           // length, fulllength

    // alloc 0x40    // calld_length    // freeMemPtr
    0x40    // calld_length
    mload
    swap1
    dup2
    add
    0x40    // calld_length
    mstore     // length, ptr

    dup1       // store length   // length, ptr, ptr
    swap2      // ptr, ptr, length
    swap1      // ptr, length, ptr
    mstore     // ptr
            swap3             // mem_ptr__, calld_start, address, calld_length
            swap2             // mem_ptr__, calld_length, address, calld_start
            swap1             // mem_ptr__, calld_length, calld_start, address
            dup4
            /* (5) t2_ptr_ // mem_ptr__, calld_length, calld_start, address, ptr   // mem_ptr__, calld_length, calld_start, address, ptr   */
// expects t2 pointer
    0x20
    add
            swap1             //  mem_ptr__, calld_length, calld_start, ptr, address
            extcodecopy       // mem_ptr__
            0xc0
            // push
            mload
            jump
        returndatacopy__21_extra:
                              // calld_length, calld_start
            dup2              // calld_length, calld_start, calld_length
            /* (4) t2_init__ 0x40    // calld_length, calld_start, mem_ptr__   // calld_length, calld_start, mem_ptr__   */
// expects length // 0x40    // calld_length = freeMemPtr
    dup1
    0x20
    add           // length, fulllength

    // alloc 0x40    // calld_length    // freeMemPtr
    0x40    // calld_length
    mload
    swap1
    dup2
    add
    0x40    // calld_length
    mstore     // length, ptr

    dup1       // store length   // length, ptr, ptr
    swap2      // ptr, ptr, length
    swap1      // ptr, length, ptr
    mstore     // ptr
            swap2             // mem_ptr__, calld_start, calld_length
            swap1             // mem_ptr__, calld_length, calld_start
            dup3
            /* (6) t2_ptr_ // mem_ptr__, calld_length, calld_start, ptr   // mem_ptr__, calld_length, calld_start, ptr   */
// expects t2 pointer
    0x20
    add
            returndatacopy    // mem_ptr__
            0xc0
            // push
            mload
            jump
        keccak256_11_extra:
            // t2ptr__
            dup1         // t2ptr__, t2ptr__
            /* (0) t2_len_ // t2ptr__, len   // t2ptr__, len   */
// expects t2 pointer
    mload
            swap1
            /* (7) t2_ptr_ // len, ptr_   // len, ptr_   */
// expects t2 pointer
    0x20
    add
            keccak256
            0xc0
            // push
            mload
            jump

    }
