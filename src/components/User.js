import React, { useEffect, useState } from "react"
import "./User.css"
import { createIcon } from '@download/blockies';
import "./Spinner.css"

function truncateAddress(address) {
    address = address.toLowerCase()
    return `${address.slice(0,6)}...${address.slice(address.length-4,address.length)}`
}

export function User({user, onSelectUser, addressCopyable=false, miscText, inline=false, displayedUser}) {

    let [isLoading, setIsLoading] = useState(true)

    var iconURL = createIcon({
        seed: user.address.toLowerCase(),
        size: 15,
        scale: 2
    }).toDataURL()

    useEffect(() => {
        setIsLoading(false)
    }, [displayedUser])

    if (inline) {
        const isAddress = !user.ens
        return <span className="inlineUser">
            <img alt={user.address} src={user.profileImage ? user.profileImage : iconURL }></img>
            <span className={isAddress ? "address" : ""} title={user.ens || user.address}>{user.ens ? user.ens : truncateAddress(user.address)}</span>
        </span>
    }

    return <div className="userItem" onClick={onSelectUser ? () => {
        onSelectUser(user)
        setIsLoading(!(displayedUser && displayedUser.address === user.address))
    } : () => {}}>
        <div className="profileImage"> 
            {/* https://stackoverflow.com/a/45212793 */}
            {
                isLoading ? <div className="spinner"></div> :
                <img alt={user.address} src={user.profileImage ? user.profileImage : iconURL }></img> 
            }
        </div>
        <div className="detailContainer">
            <div className="username" title={user.ens}>{user.ens}</div>
            <div style={{display: "flex", alignItems: "center"}}>
                <div style={addressCopyable ? {cursor: "copy"} : {}} className="address" title={user.address}
                onClick={addressCopyable ? () => window.navigator.clipboard.writeText(user.address) : () => {}}
                >{truncateAddress(user.address)}</div>
                {miscText ? <div className="misc">{miscText}</div> : <></>}
            </div>
        </div>
    </div>
}

export default User