import React, {useEffect, useState} from "react"
import User from "./User"
import { encodeObject, decodeEncodedObject, createConfirmableObject } from "../util"
import "./InvitePage.css"
import { SpinnerButton } from "./Spinner"

export function InvitePage({currentUser, route, userFromAddress, onSelectUser, provider, efd, refreshCurrentUser, history}) {
    
    let [fromUser, setFromUser] = useState(undefined)
    let [invite, setInvite] = useState(undefined)
    let [errorMessage, setErrorMessage] = useState(undefined)

    let [isAccepting, setIsAccepting] = useState(false)

    let isLoading = fromUser === undefined
    let alreadyFriends = currentUser && fromUser && currentUser.friends.map(u=>u.address.toLowerCase()).includes(fromUser.address.toLowerCase())

    useEffect(() => {
        if (invite) {
            if (invite.toAddress.toLowerCase() !== currentUser.address.toLowerCase()) {
                setErrorMessage("Invite is addressed to a different user")
                return
            }
            if (alreadyFriends) {
                setErrorMessage("You are already friends")
                return
            }
            
            setErrorMessage(undefined)
            return
        }
        (async function init() {
            if (!fromUser && currentUser) {
                try {
                    const inviteJSON = decodeEncodedObject(route.match.params.encodedInvite)
                    const user = await userFromAddress(inviteJSON.fromAddress)

                    setFromUser(user)
            
                    if (inviteJSON.toAddress.toLowerCase() !== currentUser.address.toLowerCase()) {
                        setErrorMessage("Invite is addressed to a different user")
                        return
                    }

                    setInvite(inviteJSON)
                } catch (error) {
                    console.error(error)
                    setFromUser(null)
                    setErrorMessage("Invalid invite")
                }    
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, invite])

    const acceptInvite = async () => {
        setIsAccepting(true)
        try {
            const confirmableInvite = await createConfirmableObject(invite, provider.getSigner(0), efd)
            const encodedInvite = encodeObject(confirmableInvite)
            setInvite(confirmableInvite)
            history.push(`/confirm/${encodedInvite}`)
        } catch(error) {
            console.error(error)
        }
        setIsAccepting(false)
    }

    return <div className="card invite">
        <h2>Invite</h2>
        {currentUser == null ? <div>Not connected</div> : 
        isLoading ? <div>Loading...</div> : 
        // eslint-disable-next-line eqeqeq
        fromUser == null ? <div>Invalid invite</div> : <>
            <User user={fromUser} onSelectUser={onSelectUser} addressCopyable={true}></User>
            <div style={{display: "flex", flexGrow: "1", marginTop: "15px"}} >
                {
                    errorMessage ? errorMessage : 
                    <>
                    <SpinnerButton className="actionButton" isSpinning={isAccepting} onClick={async () => await acceptInvite()}>Accept</SpinnerButton>
                    <button onClick={() => history.push("/")} className="actionButton btnSecondary">Ignore</button>
                    </>
                }
            </div>
        </>
        }
    </div>
}

export default InvitePage