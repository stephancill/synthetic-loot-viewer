import React, {useEffect, useState} from "react"
import User from "./User"
import { encodeObject, decodeEncodedObject } from "../util"
import "./InvitePage.css"
import { SpinnerButton } from "./Spinner"
import { LinkIcon } from '@primer/octicons-react'

// TODO: Refactor confirm page and invite page to common component with arguments
export function ConfirmPage({currentUser, route, userFromAddress, onSelectUser, provider, efd, refreshCurrentUser, history}) {
    
    let [fromUser, setFromUser] = useState(undefined)
    let [toUser, setToUser] = useState(undefined)
    let [invite, setInvite] = useState(undefined)
    let [errorMessage, setErrorMessage] = useState(undefined)
    let [isConfirming, setIsConfirming] = useState(false)
    let [confirmURL, setConfirmURL] = useState(undefined)

    let isLoading = fromUser === undefined

    let alreadyFriends = toUser && fromUser && toUser.friends.map(u=>u.address).includes(fromUser.address)

    useEffect(() => {
        if (invite) {
            if (alreadyFriends) {
                setErrorMessage("Are already friends")
                return
            }
            
            setErrorMessage(undefined)
            return
        }
        (async function init() {
            if (!fromUser && currentUser) {
                try {
                    const inviteJSON = decodeEncodedObject(route.match.params.encodedInvite)
                    const fromUser = await userFromAddress(inviteJSON.fromAddress)
                    const toUser = await userFromAddress(inviteJSON.toAddress)

                    setFromUser(fromUser)
                    setToUser(toUser)
            
                    if (inviteJSON.toAddress.toLowerCase() !== currentUser.address.toLowerCase()) {
                        setErrorMessage("Invite is addressed to a different user")
                        return
                    }

                    const encodedInvite = encodeObject(inviteJSON)

                    const url = `${window.location.protocol}//${window.location.host}/#/confirm/${encodedInvite}`

                    console.log(url)

                    setInvite(inviteJSON)
                    setConfirmURL(url)
                } catch (error) {
                    console.error(error)
                    setErrorMessage("Invalid invite")
                }    
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, invite, isConfirming])

    const confirmInvite = async () => {
        setIsConfirming(true)
        try {
            const tx = await efd.confirmRequest(invite.fromAddress, invite.toAddress, invite.fromSignature, invite.toSignature)
            await tx.wait()
            
            const fromUser = await userFromAddress(invite.fromAddress)
            const toUser = await userFromAddress(invite.toAddress)

            setFromUser(fromUser)
            setToUser(toUser)
            refreshCurrentUser()
        } catch(error) {
            console.error(error)
        }
        setIsConfirming(false)
    }

    return <div className="card invite">
        <h2>Confirm Invite</h2>
        {currentUser == null ? <div>Not connected</div> : 
        isLoading ? <div>Loading...</div> : 
        // eslint-disable-next-line eqeqeq
        fromUser == null || toUser == null ? <div>Invalid invite</div> : <>
            <div>From</div>
            <User user={fromUser} onSelectUser={onSelectUser} addressCopyable={true}></User>
            <div>To</div>
            <User user={toUser} onSelectUser={onSelectUser} addressCopyable={true}></User>
            <div style={{display: "flex", marginTop: "15px", marginRight: "15px", alignItems: "center"}} >
                {
                    errorMessage ? errorMessage :
                    <>
                        <SpinnerButton style={{width: "100px", flex: "1"}} className="actionButton" isSpinning={isConfirming} onClick={async () => await confirmInvite()}>Confirm</SpinnerButton> 
                        <button style={{
                                border: "none", 
                                backgroundColor: "rgba(0, 0, 0, 0)",
                                cursor: "pointer",
                                marginBottom: "6px"
                            }} title="Copy confirm link" onClick={() => window.navigator.clipboard.writeText(confirmURL)}><LinkIcon/></button>
                    </>
                }
            </div>
        </>
        }
    </div>
}

export default ConfirmPage