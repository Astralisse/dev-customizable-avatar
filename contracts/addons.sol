// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract AvatarAddons is Ownable, ERC1155 {
    constructor()
        Ownable(msg.sender)
        ERC1155("https://0.dev.astralisse.com/addon/metadata/{id}")
    {}

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mint(uint256[] memory ids, uint256[] memory values) public {
        _mintBatch(msg.sender, ids, values, "");
    }
}
