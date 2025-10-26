// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GrantDistribution (Native CELO Version)
 * @dev Voting-Based Grant Distribution on Celo using native CELO
 * @notice Smart contract where companies vote on project grant proposals
 */
contract GrantDistributionCELO is Ownable, ReentrancyGuard {
    
    // Structs
    struct Company {
        address companyAddress;
        string name;
        bool isActive;
        uint256 registeredAt;
    }
    
    struct Project {
        uint256 id;
        address payable projectAddress;
        string name;
        string description;
        string githubUrl;
        uint256 requestedAmount;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 totalGrantsReceived;
        uint256 createdAt;
        bool isActive;
        bool isApproved;
        bool isFunded;
    }
    
    struct Vote {
        address company;
        bool support;
        uint256 timestamp;
    }
    
    // State variables
    mapping(address => Company) public companies;
    address[] public companyList;
    uint256 public requiredCompanyCount = 5;
    
    mapping(uint256 => Project) public projects;
    mapping(address => uint256[]) public projectsByAddress;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => Vote[]) public projectVotes;
    
    // Project assignment: projectId => list of assigned company addresses
    mapping(uint256 => address[]) public projectAssignments;
    // Company => list of assigned project IDs
    mapping(address => uint256[]) public companyAssignedProjects;
    // Quick lookup: projectId => companyAddress => isAssigned
    mapping(uint256 => mapping(address => bool)) public isProjectAssignedToCompany;
    
    uint256 public projectCount;
    uint256 public totalDistributed;
    uint256 public majorityThreshold = 3;
    
    // Events
    event CompanyRegistered(
        address indexed companyAddress,
        string name,
        uint256 timestamp
    );
    
    event ProjectAssignedToCompany(
        uint256 indexed projectId,
        address indexed companyAddress,
        uint256 timestamp
    );
    
    event ProjectProposed(
        uint256 indexed projectId,
        address indexed projectAddress,
        string name,
        uint256 requestedAmount,
        uint256 timestamp
    );
    
    event VoteCast(
        uint256 indexed projectId,
        address indexed company,
        bool support,
        uint256 timestamp
    );
    
    event ProjectApproved(
        uint256 indexed projectId,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 timestamp
    );
    
    event GrantDistributed(
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event TreasuryDeposit(address indexed from, uint256 amount);
    
    // Modifiers
    modifier onlyCompany() {
        require(companies[msg.sender].isActive, "Only registered companies can call this");
        _;
    }
    
    modifier projectExists(uint256 _projectId) {
        require(_projectId < projectCount, "Project does not exist");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Register a new company (only owner can do this)
     */
    function registerCompany(address _companyAddress, string memory _name) external onlyOwner {
        require(!companies[_companyAddress].isActive, "Company already registered");
        require(companyList.length < requiredCompanyCount, "Maximum companies reached");
        
        companies[_companyAddress] = Company({
            companyAddress: _companyAddress,
            name: _name,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        companyList.push(_companyAddress);
        
        emit CompanyRegistered(_companyAddress, _name, block.timestamp);
    }
    
    /**
     * @dev Remove a company (only owner)
     */
    function removeCompany(address _companyAddress) external onlyOwner {
        require(companies[_companyAddress].isActive, "Company not registered");
        companies[_companyAddress].isActive = false;
    }
    
    /**
     * @dev Admin assigns a project to specific companies for voting
     */
    function assignProjectToCompanies(
        uint256 _projectId,
        address[] memory _companyAddresses
    ) external onlyOwner projectExists(_projectId) {
        require(_companyAddresses.length > 0, "Must assign to at least one company");
        
        for (uint256 i = 0; i < _companyAddresses.length; i++) {
            address companyAddr = _companyAddresses[i];
            require(companies[companyAddr].isActive, "Company not registered");
            
            if (!isProjectAssignedToCompany[_projectId][companyAddr]) {
                projectAssignments[_projectId].push(companyAddr);
                companyAssignedProjects[companyAddr].push(_projectId);
                isProjectAssignedToCompany[_projectId][companyAddr] = true;
                
                emit ProjectAssignedToCompany(_projectId, companyAddr, block.timestamp);
            }
        }
    }
    
    /**
     * @dev Get all projects assigned to a company
     */
    function getCompanyAssignedProjects(address _companyAddress) external view returns (uint256[] memory) {
        return companyAssignedProjects[_companyAddress];
    }
    
    /**
     * @dev Get all companies assigned to a project
     */
    function getProjectAssignedCompanies(uint256 _projectId) external view returns (address[] memory) {
        return projectAssignments[_projectId];
    }
    
    /**
     * @dev Project owner proposes a new project with requested grant amount
     */
    function proposeProject(
        string memory _name,
        string memory _description,
        string memory _githubUrl,
        uint256 _requestedAmount
    ) external returns (uint256) {
        require(_requestedAmount > 0, "Requested amount must be greater than 0");
        require(companyList.length == requiredCompanyCount, "Not enough companies registered");
        
        uint256 projectId = projectCount;
        
        projects[projectId] = Project({
            id: projectId,
            projectAddress: payable(msg.sender),
            name: _name,
            description: _description,
            githubUrl: _githubUrl,
            requestedAmount: _requestedAmount,
            votesFor: 0,
            votesAgainst: 0,
            totalGrantsReceived: 0,
            createdAt: block.timestamp,
            isActive: true,
            isApproved: false,
            isFunded: false
        });
        
        projectsByAddress[msg.sender].push(projectId);
        projectCount++;
        
        emit ProjectProposed(projectId, msg.sender, _name, _requestedAmount, block.timestamp);
        
        return projectId;
    }
    
    /**
     * @dev Companies vote on a project proposal
     */
    function voteOnProject(uint256 _projectId, bool _support) 
        external 
        onlyCompany 
        projectExists(_projectId) 
    {
        Project storage project = projects[_projectId];
        require(project.isActive, "Project is not active");
        require(!project.isFunded, "Project already funded");
        require(!hasVoted[_projectId][msg.sender], "Already voted on this project");
        require(isProjectAssignedToCompany[_projectId][msg.sender], "Project not assigned to your company");
        
        hasVoted[_projectId][msg.sender] = true;
        
        if (_support) {
            project.votesFor++;
        } else {
            project.votesAgainst++;
        }
        
        projectVotes[_projectId].push(Vote({
            company: msg.sender,
            support: _support,
            timestamp: block.timestamp
        }));
        
        emit VoteCast(_projectId, msg.sender, _support, block.timestamp);
        
        // Check if majority reached
        uint256 assignedCompanyCount = projectAssignments[_projectId].length;
        uint256 requiredVotes = (assignedCompanyCount / 2) + 1;
        
        if (project.votesFor >= requiredVotes) {
            _approveAndFundProject(_projectId);
        }
    }
    
    /**
     * @dev Internal function to approve and automatically fund project
     */
    function _approveAndFundProject(uint256 _projectId) internal {
        Project storage project = projects[_projectId];
        
        require(!project.isApproved, "Project already approved");
        require(!project.isFunded, "Project already funded");
        
        project.isApproved = true;
        
        emit ProjectApproved(_projectId, project.votesFor, project.votesAgainst, block.timestamp);
        
        // Automatically distribute grant using native CELO
        uint256 contractBalance = address(this).balance;
        
        require(contractBalance >= project.requestedAmount, "Insufficient treasury balance");
        
        (bool success, ) = project.projectAddress.call{value: project.requestedAmount}("");
        require(success, "Transfer failed");
        
        project.isFunded = true;
        project.totalGrantsReceived = project.requestedAmount;
        totalDistributed += project.requestedAmount;
        
        emit GrantDistributed(
            _projectId,
            project.projectAddress,
            project.requestedAmount,
            block.timestamp
        );
    }
    
    /**
     * @dev Deposit native CELO to treasury
     */
    function depositToTreasury() external payable {
        require(msg.value > 0, "Must send CELO");
        emit TreasuryDeposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Allow contract to receive CELO
     */
    receive() external payable {
        emit TreasuryDeposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Update voting threshold (only owner)
     */
    function updateMajorityThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold > 0 && _newThreshold <= requiredCompanyCount, "Invalid threshold");
        majorityThreshold = _newThreshold;
    }
    
    /**
     * @dev Get project details
     */
    function getProject(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (Project memory) 
    {
        return projects[_projectId];
    }
    
    /**
     * @dev Get all votes for a project
     */
    function getProjectVotes(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (Vote[] memory) 
    {
        return projectVotes[_projectId];
    }
    
    /**
     * @dev Get projects by address
     */
    function getProjectsByAddress(address _address) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return projectsByAddress[_address];
    }
    
    /**
     * @dev Get all registered companies
     */
    function getAllCompanies() external view returns (address[] memory) {
        return companyList;
    }
    
    /**
     * @dev Check if address is a registered company
     */
    function isCompany(address _address) external view returns (bool) {
        return companies[_address].isActive;
    }
    
    /**
     * @dev Get treasury balance (native CELO)
     */
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = owner().call{value: _amount}("");
        require(success, "Withdraw failed");
    }
}
