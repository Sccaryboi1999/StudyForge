export const DEMO_GUIDE = `Introduction to Computer Networking

LANs and WANs
A local area network (LAN) connects devices within a limited area such as a home, school, or office. A wide area network (WAN) spans a large geographic area and often connects multiple LANs. The internet is the largest example of a WAN.

Routers and Switches
A router forwards data between different networks and chooses a path for packets. A switch connects devices within the same LAN and forwards frames by using MAC addresses. Routers primarily operate at OSI layer 3, while traditional switches operate at layer 2.

IPv4 and IPv6
An IPv4 address is 32 bits long and is commonly written as four decimal octets, such as 192.168.1.10. An IPv6 address is 128 bits long and is written in hexadecimal groups. IPv6 provides a much larger address space than IPv4.

MAC Addresses
A media access control (MAC) address identifies a network interface on a local network. A standard MAC address is 48 bits long. Switches learn which MAC addresses are reachable through each port.

The OSI Model
The OSI model organizes network communication into seven layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. The model helps engineers describe where network functions occur and troubleshoot problems systematically.

TCP and UDP
Transmission Control Protocol (TCP) is connection-oriented and provides ordered, reliable delivery with retransmission. User Datagram Protocol (UDP) is connectionless and has lower overhead, but it does not guarantee delivery or ordering. TCP is useful when reliability matters, while UDP is useful when speed and low latency matter more than guaranteed delivery.`;

export const DEMO_TITLE = "Introduction to Computer Networking";
