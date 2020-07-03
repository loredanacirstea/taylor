# taylor

In-work.

Try it out: https://loredanacirstea.github.io/taylor/

Demos: https://www.youtube.com/playlist?list=PL323JufuD9JAgnda2E8mGn_GDcD5ef4mH

Examples to try out: (!only one line at a time)

```lisp
(add (add (sub 7 2) 1) 41)
(list 5 4 (add 6 2) 3 (sub 6 1))
(if (gt 4 9) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))

# define and use lambdas in-memory
( (fn* (a b) (add (mul a b ) b)) 2 3)

# define and store functions on-chain
(def! myfunction (fn* (a b) (add (add (sub a b) a) b)))

# use a stored function; notice the _
(_myfunction 5 3)

(concat "0x11aaaabb" "0x221111ccdd")
(contig 2 "0x221111ccdd")

(def! fib (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(_fib (sub n 1)) (_fib (sub n 2)) ) )))

# higher order functions
(map _fib (list 5 8 2))
```

## Ballot 

Implementing Solidity's Ballot contract from https://solidity.readthedocs.io/en/v0.6.10/solidity-by-example.html#voting. See https://github.com/loredanacirstea/taylor/blob/ff253038d8b83f48b4d897f3b6b455924ef848a2/tests/maltay.test.js#L1159 for ver. 0.0.2.

```lisp
(list 
    ; weight, voted, delegate, vote (proposal index)
    (defstruct! Voter (list Uint Bool Address Uint))
    
    ; name, voteCount
    (defstruct! Proposal (list String32 Uint) )

    (defmap! "voters" Address "Voter")
    
    ; (name! chairperson (save! (caller)))
    (store! 0 (caller))

    (def! giveRightToVote! (fn* (voterAddress)
        (if (eq (caller) (sload 0 Address))
            (if (nil? (mapget voters voterAddress))
                (mapset! voters voterAddress (struct! Voter (list 1 false "0x0000000000000000000000000000000000000000" 0)))
                (revert "The voter already voted.")
            )
            (revert "Only chairperson can give right to vote.")
        )
    ))

    (def! recDelegation (fn* (to_address)
        (let* (
                delegate_raw (mapget voters to_address)
                delegate (list-struct delegate_raw)
            )
            (if (nil? delegate)
                ; (revert "Delegate cannot vote")
                (revert to_address)
                (let* (delegateOfDelegate (nth delegate 2))
                    (if (or
                            (nil? delegateOfDelegate)
                            (eq delegateOfDelegate "0x0000000000000000000000000000000000000000")
                        )
                        to_address
                        (if (eq delegateOfDelegate (caller))
                            (revert "Found loop in delegation.")
                            (recDelegation delegateOfDelegate)
                        )
                    )
                )
            )
        )
    ))

    (def! delegate! (fn* (to_address)
        (let* (
                sender_raw (mapget voters (caller))
                sender (list-struct sender_raw)
                sender_types (defstruct Voter)
                sender_indexes (refs-struct sender_raw)
            )
            (if (true? (nth sender 1))
                (revert "You already voted.")
                (if (eq to_address (caller))
                    (revert "Self-delegation is disallowed.")
                    (let* (
                            delegateAddress (recDelegation to_address)
                            delegate_raw (mapget voters delegateAddress)
                            delegate (list-struct delegate_raw)
                        )
                        (list
                            ; sender.voted = true
                            (update! (nth sender_types 1) (nth sender_indexes 1) true)
                            ; sender.delegate = to
                            (update! (nth sender_types 2) (nth sender_indexes 2) delegateAddress)
                            (if (true? (nth delegate 1))
                                ; proposals[delegate_.vote].voteCount += sender.weight
                                (let* (
                                        proposal_raw (getfrom Proposal (nth delegate 3))
                                        proposal (list-struct proposal_raw)
                                        proposal_types (defstruct Proposal)
                                        proposal_indexes (refs-struct proposal_raw)
                                    )
                                    (update! (nth proposal_types 1) (nth proposal_indexes 1) (add (nth sender 0) (nth proposal 1)))
                                )

                                ; delegate_.weight += sender.weight
                                (let* (
                                        delegate_types (defstruct Voter)
                                        delegate_indexes (refs-struct delegate_raw)
                                    )
                                    (update! (nth delegate_types 0) (nth delegate_indexes 0) (add (nth delegate 0) (nth sender 0)))
                                )
                            )
                        )
                    )
                )
            )
        )
    ))

    (def! vote! (fn* (proposalIndex)
        (let* (
                sender_raw (mapget voters (caller))
                ; values for: weight, voted, delegate, vote
                sender (list-struct sender_raw)
                
                ; types for: weight, voted, delegate, vote
                sender_types (defstruct Voter)
                
                ; DB index for each struct component
                sender_indexes (refs-struct sender_raw)
                
                proposal_raw (getfrom Proposal proposalIndex)
                ; values: name, voteCount
                proposal (list-struct proposal_raw)
                proposal_types (defstruct Proposal)
                proposal_indexes (refs-struct proposal_raw)
            )
            (if (or 
                    (or (nil? sender) (true? (nth sender 1)))
                    (lt (nth sender 0) 1)
                )
                (revert "Has no right to vote")
                (list
                    ; sender.voted = true
                    (update! (nth sender_types 1) (nth sender_indexes 1) true)
                    ; sender.vote = proposal
                    (update! (nth sender_types 3) (nth sender_indexes 3) proposalIndex)
                    
                    ; proposals[proposal].voteCount += sender.weight
                    (update! (nth proposal_types 1) (nth proposal_indexes 1) (add (nth sender 0) (nth proposal 1)))
                )
            )
        )
    ))

    (list
        (struct! Proposal (list "proposal1" 0))
        (struct! Proposal (list "proposal2" 0))
        (struct! Proposal (list "proposal3" 0))
    )
)
```

Then:
- `(giveRightToVote! "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51")`
- `(vote! 2)`
- `(delegate! "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51")`


